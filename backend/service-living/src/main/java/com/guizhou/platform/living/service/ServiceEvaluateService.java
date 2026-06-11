package com.guizhou.platform.living.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.living.dto.request.EvaluateCreateDTO;
import com.guizhou.platform.living.dto.response.EvaluateVO;
import com.guizhou.platform.living.entity.ServiceEvaluate;

import java.util.List;

public interface ServiceEvaluateService extends IService<ServiceEvaluate> {

    Long submitEvaluate(EvaluateCreateDTO dto, Long userId);

    EvaluateVO getEvaluateDetail(Long evaluateId);

    List<EvaluateVO> listEvaluatesByProvider(Long providerId);

    List<EvaluateVO> listEvaluatesByStaff(Long staffId);

    List<EvaluateVO> listEvaluatesByBooking(Long bookingId);

    void replyEvaluate(Long evaluateId, String replyContent, Long replyBy);
}
