package com.guizhou.platform.government.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.common.base.PageResult;
import com.guizhou.platform.government.dto.request.ServiceApplyDTO;
import com.guizhou.platform.government.entity.ServiceApply;

public interface ServiceApplyService extends IService<ServiceApply> {

    Long submitApply(ServiceApplyDTO dto);

    void withdrawApply(Long applyId);

    void supplementMaterial(Long applyId, ServiceApplyDTO dto);

    void acceptApply(Long applyId, String opinion);

    void rejectApply(Long applyId, String opinion);

    void startProcess(Long applyId);

    void completeApply(Long applyId, String completeResult, String resultDocumentNo);

    PageResult<ServiceApply> pageApplies(Integer pageNum, Integer pageSize, String applyNo,
                                          String applicantName, String applicantIdCard,
                                          Integer applyStatus, Long itemId);

    ServiceApply getApplyDetail(Long applyId);
}
