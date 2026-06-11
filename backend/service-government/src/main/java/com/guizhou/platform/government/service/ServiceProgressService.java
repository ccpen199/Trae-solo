package com.guizhou.platform.government.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.government.dto.response.ApplyProgressVO;
import com.guizhou.platform.government.entity.ServiceProgress;

import java.util.List;

public interface ServiceProgressService extends IService<ServiceProgress> {

    ApplyProgressVO getApplyProgress(Long applyId);

    ApplyProgressVO getApplyProgressByApplyNo(String applyNo);

    List<ApplyProgressVO> getMyProgress(String applicantIdCard);

    void createProgressNode(Long applyId, String nodeName, String nodeDesc, String operatorName, String operatorDept);

    void completeProgressNode(Long progressId, String opinion);

    void sendProgressNotification(Long applyId);
}
