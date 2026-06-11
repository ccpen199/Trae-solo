package com.guizhou.platform.ticket.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.guizhou.platform.common.exception.BusinessException;
import com.guizhou.platform.ticket.dto.request.HotlineMessageDTO;
import com.guizhou.platform.ticket.dto.request.TicketCreateDTO;
import com.guizhou.platform.ticket.entity.HotlineMessage;
import com.guizhou.platform.ticket.enums.TicketSourceEnum;
import com.guizhou.platform.ticket.mapper.HotlineMessageMapper;
import com.guizhou.platform.ticket.service.HotlineAdapterService;
import com.guizhou.platform.ticket.service.TicketService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
public class HotlineAdapterServiceImpl implements HotlineAdapterService {

    @Resource
    private HotlineMessageMapper hotlineMessageMapper;

    @Resource
    private TicketService ticketService;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String receiveHotlineMessage(HotlineMessageDTO dto) {
        HotlineMessage message = new HotlineMessage();
        BeanUtils.copyProperties(dto, message);
        message.setProcessStatus(0);
        message.setMessageType(dto.getMessageType() != null ? dto.getMessageType() : 0);
        hotlineMessageMapper.insert(message);

        log.info("接收12345热线消息: messageId={}", dto.getMessageId());
        return message.getMessageId();
    }

    @Override
    public List<HotlineMessage> listPendingMessages() {
        return hotlineMessageMapper.selectList(new LambdaQueryWrapper<HotlineMessage>()
                .eq(HotlineMessage::getProcessStatus, 0)
                .orderByAsc(HotlineMessage::getCallTime));
    }

    @Override
    public void syncHotlineMessages() {
        log.info("开始同步12345热线消息");
        List<HotlineMessage> pendingMessages = listPendingMessages();
        log.info("待处理热线消息数: {}", pendingMessages.size());

        for (HotlineMessage message : pendingMessages) {
            try {
                createTicketFromHotline(message.getId());
            } catch (Exception e) {
                log.error("处理热线消息失败: messageId={}, error={}", message.getMessageId(), e.getMessage());
            }
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public String createTicketFromHotline(Long messageId) {
        HotlineMessage message = hotlineMessageMapper.selectById(messageId);
        if (message == null) {
            throw new BusinessException("热线消息不存在");
        }
        if (message.getProcessStatus() == 1) {
            throw new BusinessException("热线消息已处理");
        }

        TicketCreateDTO dto = new TicketCreateDTO();
        dto.setTitle("[12345热线] " + (message.getCallContent() != null && message.getCallContent().length() > 50
                ? message.getCallContent().substring(0, 50) + "..." : message.getCallContent()));
        dto.setContent(message.getCallContent());
        dto.setSource(TicketSourceEnum.HOTLINE_12345.getCode());
        dto.setCitizenName(message.getCallerName());
        dto.setCitizenPhone(message.getCallerNumber());
        dto.setCitizenIdCard(message.getCallerIdCard());
        dto.setRegionCode(message.getRegionCode());
        dto.setRegionName(message.getRegionName());

        String ticketNo = ticketService.createTicket(dto);

        message.setProcessStatus(1);
        message.setTicketNo(ticketNo);
        hotlineMessageMapper.updateById(message);

        log.info("12345热线消息转工单成功: messageId={}, ticketNo={}", message.getMessageId(), ticketNo);
        return ticketNo;
    }
}
