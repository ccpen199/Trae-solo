package com.guizhou.platform.ticket.service;

import com.guizhou.platform.ticket.dto.request.HotlineMessageDTO;
import com.guizhou.platform.ticket.entity.HotlineMessage;

import java.util.List;

public interface HotlineAdapterService {

    String receiveHotlineMessage(HotlineMessageDTO dto);

    List<HotlineMessage> listPendingMessages();

    void syncHotlineMessages();

    String createTicketFromHotline(Long messageId);
}
