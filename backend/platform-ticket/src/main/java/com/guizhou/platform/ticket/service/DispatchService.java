package com.guizhou.platform.ticket.service;

import com.guizhou.platform.ticket.dto.response.DispatchResultVO;

public interface DispatchService {

    DispatchResultVO autoDispatch(Long ticketId);

    DispatchResultVO manualDispatch(Long ticketId, Long departmentId, String reason);

    Double calculateMatchScore(String nlpCategory, String nlpKeywords, Long departmentId);
}
