package com.guizhou.platform.subsidyverify.service.impl;

import com.guizhou.platform.subsidyverify.service.SubsidyClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubsidyClientServiceImpl implements SubsidyClientService {

    private final RestTemplate restTemplate;

    private static final String SUBSIDY_SERVICE_URL = "http://platform-subsidy/subsidy";

    @Override
    public boolean verifyEligibility(Long beneficiaryId, Long policyId) {
        try {
            String url = SUBSIDY_SERVICE_URL + "/api/grant/eligibility?beneficiaryId={beneficiaryId}&policyId={policyId}";
            Map<String, Object> params = new HashMap<>();
            params.put("beneficiaryId", beneficiaryId);
            params.put("policyId", policyId);
            Map<String, Object> result = restTemplate.getForObject(url, Map.class, params);
            return result != null && Boolean.TRUE.equals(result.get("eligible"));
        } catch (Exception e) {
            log.error("调用补贴监管服务验证资格失败, beneficiaryId={}, policyId={}", beneficiaryId, policyId, e);
            return false;
        }
    }

    @Override
    public boolean deductBalance(Long grantId, BigDecimal amount) {
        try {
            String url = SUBSIDY_SERVICE_URL + "/api/grant/{id}/deduct";
            Map<String, Object> params = new HashMap<>();
            params.put("id", grantId);
            params.put("amount", amount);
            Map<String, Object> body = new HashMap<>();
            body.put("amount", amount);
            Map<String, Object> result = restTemplate.postForObject(url, body, Map.class, params);
            return result != null && Boolean.TRUE.equals(result.get("success"));
        } catch (Exception e) {
            log.error("调用补贴监管服务扣减余额失败, grantId={}, amount={}", grantId, amount, e);
            return false;
        }
    }

    @Override
    public Map<String, Object> getSubsidyDetail(Long grantId) {
        try {
            String url = SUBSIDY_SERVICE_URL + "/api/grant/{id}";
            Map<String, Object> params = new HashMap<>();
            params.put("id", grantId);
            return restTemplate.getForObject(url, Map.class, params);
        } catch (Exception e) {
            log.error("调用补贴监管服务获取发放详情失败, grantId={}", grantId, e);
            return null;
        }
    }

    @Override
    public Map<String, Object> getPolicyDetail(Long policyId) {
        try {
            String url = SUBSIDY_SERVICE_URL + "/api/policy/{id}";
            Map<String, Object> params = new HashMap<>();
            params.put("id", policyId);
            return restTemplate.getForObject(url, Map.class, params);
        } catch (Exception e) {
            log.error("调用补贴监管服务获取政策详情失败, policyId={}", policyId, e);
            return null;
        }
    }
}
