package com.guizhou.platform.subsidy.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.subsidy.config.RiskEngineConfig;
import com.guizhou.platform.subsidy.dto.request.RiskRuleDTO;
import com.guizhou.platform.subsidy.entity.RiskRule;
import com.guizhou.platform.subsidy.entity.RiskWarning;
import com.guizhou.platform.subsidy.entity.SubsidyGrant;
import com.guizhou.platform.subsidy.enums.RiskLevelEnum;
import com.guizhou.platform.subsidy.mapper.RiskRuleMapper;
import com.guizhou.platform.subsidy.mapper.RiskWarningMapper;
import com.guizhou.platform.subsidy.mapper.SubsidyGrantMapper;
import com.guizhou.platform.subsidy.service.RiskEngineService;
import com.guizhou.platform.subsidy.service.SuperviseService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
public class RiskEngineServiceImpl extends ServiceImpl<RiskRuleMapper, RiskRule> implements RiskEngineService {

    @Resource
    private RiskEngineConfig riskEngineConfig;

    @Resource
    private RiskWarningMapper warningMapper;

    @Resource
    private SubsidyGrantMapper grantMapper;

    @Resource
    private SuperviseService superviseService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createRiskRule(RiskRuleDTO dto) {
        RiskRule rule = new RiskRule();
        BeanUtils.copyProperties(dto, rule);
        rule.setEnabled(true);
        this.save(rule);
        return rule.getId();
    }

    @Override
    public void enableRiskRule(Long ruleId) {
        RiskRule rule = this.getById(ruleId);
        if (rule == null) {
            throw new BusinessException("风控规则不存在");
        }
        rule.setEnabled(true);
        this.updateById(rule);
    }

    @Override
    public void disableRiskRule(Long ruleId) {
        RiskRule rule = this.getById(ruleId);
        if (rule == null) {
            throw new BusinessException("风控规则不存在");
        }
        rule.setEnabled(false);
        this.updateById(rule);
    }

    @Override
    public Integer evaluateGrantRisk(SubsidyGrant grant) {
        if (!riskEngineConfig.getEnabled()) {
            return 0;
        }

        int totalScore = 0;
        List<RiskRule> rules = getEnabledRules();
        List<String> riskTypes = new ArrayList<>();
        List<String> riskDescs = new ArrayList<>();

        for (RiskRule rule : rules) {
            boolean triggered = evaluateRule(rule, grant);
            if (triggered) {
                totalScore += rule.getRiskScore();
                riskTypes.add(rule.getRuleType());
                riskDescs.add(rule.getRuleName() + ": " + rule.getRuleDescription());
                log.warn("风险规则触发: {}, 类型: {}, 分值: {}", rule.getRuleName(), rule.getRuleType(), rule.getRiskScore());
            }
        }

        if (totalScore >= riskEngineConfig.getWarningThreshold()) {
            createRiskWarning(grant, totalScore, riskTypes, riskDescs);
        }

        return totalScore;
    }

    private boolean evaluateRule(RiskRule rule, SubsidyGrant grant) {
        try {
            String expression = rule.getRuleExpression();
            Map<String, Object> context = buildContext(grant);

            if (expression.contains("duplicate")) {
                return checkDuplicateGrant(grant.getPolicyId(), grant.getBeneficiaryId());
            }
            if (expression.contains("abnormal_amount")) {
                return checkAbnormalAmount(grant.getApplyAmount(), grant.getPolicyId());
            }
            if (expression.contains("suspicious_account")) {
                return checkSuspiciousAccount(grant.getBankAccount());
            }
            if (expression.contains("invalid_idcard")) {
                return !isValidIdCard(grant.getIdCard());
            }
            if (expression.contains("invalid_phone")) {
                return !isValidPhone(grant.getPhone());
            }
            if (expression.contains("amount_exceed")) {
                return grant.getApplyAmount().compareTo(rule.getThresholdValue()) > 0;
            }

            return false;
        } catch (Exception e) {
            log.error("规则评估失败: {}", rule.getRuleName(), e);
            return false;
        }
    }

    private Map<String, Object> buildContext(SubsidyGrant grant) {
        Map<String, Object> context = new HashMap<>();
        context.put("beneficiaryId", grant.getBeneficiaryId());
        context.put("policyId", grant.getPolicyId());
        context.put("applyAmount", grant.getApplyAmount());
        context.put("bankAccount", grant.getBankAccount());
        context.put("idCard", grant.getIdCard());
        context.put("phone", grant.getPhone());
        return context;
    }

    @Transactional(rollbackFor = Exception.class)
    public void createRiskWarning(SubsidyGrant grant, int score, List<String> riskTypes, List<String> riskDescs) {
        RiskLevelEnum level = RiskLevelEnum.getByScore(score);

        RiskWarning warning = new RiskWarning();
        warning.setWarningNo("WARN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        warning.setGrantId(grant.getId());
        warning.setGrantNo(grant.getGrantNo());
        warning.setPolicyId(grant.getPolicyId());
        warning.setPolicyCode(grant.getPolicyCode());
        warning.setBeneficiaryId(grant.getBeneficiaryId());
        warning.setBeneficiaryName(grant.getBeneficiaryName());
        warning.setRiskLevel(level.getCode());
        warning.setRiskType(String.join(",", riskTypes));
        warning.setRiskScore(score);
        warning.setRiskDesc(String.join("; ", riskDescs));
        warning.setRiskEvidence("自动风控检测");
        warning.setWarningStatus(0);
        warning.setAutoFreeze(riskEngineConfig.getAutoFreeze() && level.getCode() >= RiskLevelEnum.HIGH.getCode());

        if (Boolean.TRUE.equals(warning.getAutoFreeze())) {
            warning.setFreezeTime(LocalDateTime.now());
            warning.setFreezeReason("高风险自动冻结");
        }

        warningMapper.insert(warning);

        superviseService.recordAuditLog("RISK_WARNING", warning.getId(), warning.getWarningNo(),
                1, "风险预警", null, "风控引擎", "补贴服务",
                null, warning.toString(), "风险评分: " + score);
    }

    @Override
    @Scheduled(cron = "${subsidy.schedule.risk-scan-cron:0 */5 * * * ?}")
    public void scanRisk() {
        if (!riskEngineConfig.getEnabled()) {
            return;
        }
        log.info("开始执行风险扫描任务");

        LocalDateTime startTime = LocalDateTime.now().minusHours(24);
        List<SubsidyGrant> recentGrants = grantMapper.selectList(
                new LambdaQueryWrapper<SubsidyGrant>()
                        .ge(SubsidyGrant::getCreateTime, startTime)
                        .eq(SubsidyGrant::getDeleted, false));

        for (SubsidyGrant grant : recentGrants) {
            try {
                int score = evaluateGrantRisk(grant);
                if (score > 0) {
                    log.info("补贴申请[{}]风险评分: {}", grant.getGrantNo(), score);
                }
            } catch (Exception e) {
                log.error("风险扫描失败, grantId: {}", grant.getId(), e);
            }
        }

        log.info("风险扫描任务完成, 扫描数量: {}", recentGrants.size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void processRiskWarning(Long warningId, String handlerId, String handlerName,
                                   String opinion, String result) {
        RiskWarning warning = warningMapper.selectById(warningId);
        if (warning == null) {
            throw new BusinessException("风险预警不存在");
        }

        String beforeData = warning.toString();
        warning.setWarningStatus(1);
        warning.setHandlerId(handlerId);
        warning.setHandlerName(handlerName);
        warning.setHandleTime(LocalDateTime.now());
        warning.setHandleOpinion(opinion);
        warning.setHandleResult(result);

        if (Boolean.TRUE.equals(warning.getAutoFreeze()) && "解除冻结".equals(result)) {
            warning.setAutoFreeze(false);
        }

        warningMapper.updateById(warning);

        superviseService.recordAuditLog("RISK_WARNING", warning.getId(), warning.getWarningNo(),
                2, "处理预警", null, handlerName, "补贴服务",
                beforeData, warning.toString(), opinion);
    }

    @Override
    public List<RiskRule> getEnabledRules() {
        return baseMapper.findAllEnabled();
    }

    @Override
    public boolean checkDuplicateGrant(Long policyId, String beneficiaryId) {
        List<Map<String, Object>> duplicates = grantMapper.findDuplicateGrants(policyId);
        return duplicates.stream()
                .anyMatch(map -> beneficiaryId.equals(map.get("beneficiary_id")));
    }

    @Override
    public boolean checkAbnormalAmount(BigDecimal amount, Long policyId) {
        return amount != null && amount.compareTo(new BigDecimal("100000")) > 0;
    }

    @Override
    public boolean checkSuspiciousAccount(String account) {
        if (account == null || account.length() < 10) {
            return true;
        }
        Pattern pattern = Pattern.compile("^(\\d)\\1{9,}$");
        return pattern.matcher(account).matches();
    }

    private boolean isValidIdCard(String idCard) {
        if (idCard == null || idCard.length() != 18) {
            return false;
        }
        return idCard.matches("^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$");
    }

    private boolean isValidPhone(String phone) {
        if (phone == null || phone.length() != 11) {
            return false;
        }
        return phone.matches("^1[3-9]\\d{9}$");
    }
}
