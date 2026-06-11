package com.guizhou.platform.ticket.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.ticket.dto.request.TicketAssignDTO;
import com.guizhou.platform.ticket.dto.request.TicketCreateDTO;
import com.guizhou.platform.ticket.dto.request.TicketProcessDTO;
import com.guizhou.platform.ticket.dto.response.TicketDetailVO;
import com.guizhou.platform.ticket.entity.Ticket;

public interface TicketService extends IService<Ticket> {

    String createTicket(TicketCreateDTO dto);

    void assignTicket(TicketAssignDTO dto);

    void processTicket(TicketProcessDTO dto);

    void confirmTicket(Long ticketId, Integer satisfaction, String satisfactionContent);

    void closeTicket(Long ticketId);

    TicketDetailVO getTicketDetail(Long ticketId);

    Page<TicketDetailVO> pageTickets(Integer pageNum, Integer pageSize, Integer status,
                                     Integer category, Integer priority, Integer source,
                                     String regionCode, String keyword);
}
