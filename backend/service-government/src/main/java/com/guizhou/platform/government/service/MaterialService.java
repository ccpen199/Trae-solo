package com.guizhou.platform.government.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.guizhou.platform.government.dto.request.MaterialUploadDTO;
import com.guizhou.platform.government.entity.ApplyMaterial;

import java.util.List;

public interface MaterialService extends IService<ApplyMaterial> {

    List<ApplyMaterial> listByApplyId(Long applyId);

    void uploadMaterial(Long applyId, MaterialUploadDTO dto);

    void batchUploadMaterials(Long applyId, List<MaterialUploadDTO> dtoList);

    void autoFillMaterials(Long applyId, Long itemId, String applicantIdCard);

    void deleteMaterial(Long materialId);

    void verifyMaterial(Long materialId);
}
