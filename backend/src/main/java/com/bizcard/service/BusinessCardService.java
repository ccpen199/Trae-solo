package com.bizcard.service;

import com.bizcard.entity.*;
import com.bizcard.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class BusinessCardService {
    
    private final BusinessCardRepository cardRepository;
    private final ContactRepository contactRepository;
    private final CompanyRepository companyRepository;
    private final DepartmentRepository departmentRepository;
    private final CardGroupRepository groupRepository;
    private final CardGroupMappingRepository mappingRepository;
    private final AccessLogRepository accessLogRepository;
    
    public BusinessCardService(BusinessCardRepository cardRepository,
                                ContactRepository contactRepository,
                                CompanyRepository companyRepository,
                                DepartmentRepository departmentRepository,
                                CardGroupRepository groupRepository,
                                CardGroupMappingRepository mappingRepository,
                                AccessLogRepository accessLogRepository) {
        this.cardRepository = cardRepository;
        this.contactRepository = contactRepository;
        this.companyRepository = companyRepository;
        this.departmentRepository = departmentRepository;
        this.groupRepository = groupRepository;
        this.mappingRepository = mappingRepository;
        this.accessLogRepository = accessLogRepository;
    }
    
    public Page<BusinessCard> listCards(User user, Pageable pageable) {
        return cardRepository.findAccessibleByUser(user, pageable);
    }
    
    public Page<BusinessCard> searchCards(User user, String keyword, Pageable pageable) {
        return cardRepository.searchByKeyword(user, keyword, pageable);
    }
    
    public BusinessCard getCardById(Long id, User user) {
        BusinessCard card = cardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("名片不存在"));
        
        if (!Boolean.TRUE.equals(card.getIsPublic()) && 
            !user.getId().equals(Optional.ofNullable(card.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权访问此名片");
        }
        
        logAccess(user, AccessLog.AccessType.VIEW, "BusinessCard", card.getId(), card.getName());
        return card;
    }
    
    @Transactional
    public BusinessCard createCard(BusinessCard card, User user) {
        card.setOwner(user);
        card.setCreatedBy(user);
        
        if (card.getContact() != null && card.getContact().getId() != null) {
            contactRepository.findById(card.getContact().getId()).ifPresent(card::setContact);
        } else if (card.getName() != null) {
            Contact contact = contactRepository.findByNameAndOwner(card.getName(), user)
                    .orElseGet(() -> {
                        Contact newContact = new Contact();
                        newContact.setName(card.getName());
                        newContact.setOwner(user);
                        newContact.setCreatedBy(user);
                        return contactRepository.save(newContact);
                    });
            card.setContact(contact);
        }
        
        BusinessCard savedCard = cardRepository.save(card);
        logAccess(user, AccessLog.AccessType.CREATE, "BusinessCard", savedCard.getId(), savedCard.getName());
        return savedCard;
    }
    
    @Transactional
    public BusinessCard updateCard(Long id, BusinessCard updateCard, User user) {
        BusinessCard card = cardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("名片不存在"));
        
        if (!user.getId().equals(Optional.ofNullable(card.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权修改此名片");
        }
        
        if (updateCard.getName() != null) card.setName(updateCard.getName());
        if (updateCard.getPositionName() != null) card.setPositionName(updateCard.getPositionName());
        if (updateCard.getDepartmentName() != null) card.setDepartmentName(updateCard.getDepartmentName());
        if (updateCard.getCompanyName() != null) card.setCompanyName(updateCard.getCompanyName());
        if (updateCard.getPhone() != null) card.setPhone(updateCard.getPhone());
        if (updateCard.getMobile() != null) card.setMobile(updateCard.getMobile());
        if (updateCard.getEmail() != null) card.setEmail(updateCard.getEmail());
        if (updateCard.getFax() != null) card.setFax(updateCard.getFax());
        if (updateCard.getAddress() != null) card.setAddress(updateCard.getAddress());
        if (updateCard.getWebsite() != null) card.setWebsite(updateCard.getWebsite());
        if (updateCard.getQq() != null) card.setQq(updateCard.getQq());
        if (updateCard.getWechat() != null) card.setWechat(updateCard.getWechat());
        if (updateCard.getLinkedin() != null) card.setLinkedin(updateCard.getLinkedin());
        if (updateCard.getZipCode() != null) card.setZipCode(updateCard.getZipCode());
        if (updateCard.getNotes() != null) card.setNotes(updateCard.getNotes());
        if (updateCard.getIsPublic() != null) card.setIsPublic(updateCard.getIsPublic());
        
        BusinessCard savedCard = cardRepository.save(card);
        logAccess(user, AccessLog.AccessType.UPDATE, "BusinessCard", savedCard.getId(), savedCard.getName());
        return savedCard;
    }
    
    @Transactional
    public void deleteCard(Long id, User user) {
        BusinessCard card = cardRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("名片不存在"));
        
        if (!user.getId().equals(Optional.ofNullable(card.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权删除此名片");
        }
        
        cardRepository.delete(card);
        logAccess(user, AccessLog.AccessType.DELETE, "BusinessCard", card.getId(), card.getName());
    }
    
    @Transactional
    public void deleteCards(List<Long> ids, User user) {
        for (Long id : ids) {
            deleteCard(id, user);
        }
    }
    
    @Transactional
    public BusinessCard mergeToContact(Long cardId, Long contactId, User user) {
        BusinessCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("名片不存在"));
        
        if (!user.getId().equals(Optional.ofNullable(card.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权操作此名片");
        }
        
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("联系人不存在"));
        
        card.setContact(contact);
        return cardRepository.save(card);
    }
    
    @Transactional
    public void addCardToGroup(Long cardId, Long groupId, User user) {
        BusinessCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("名片不存在"));
        
        CardGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("分组不存在"));
        
        if (!user.getId().equals(Optional.ofNullable(card.getOwner()).map(User::getId).orElse(null)) &&
            !user.getId().equals(Optional.ofNullable(group.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权执行此操作");
        }
        
        mappingRepository.findByCardAndGroup(card, group).ifPresent(m -> {
            throw new RuntimeException("名片已在此分组中");
        });
        
        CardGroupMapping mapping = new CardGroupMapping();
        mapping.setCard(card);
        mapping.setGroup(group);
        mappingRepository.save(mapping);
    }
    
    @Transactional
    public void removeCardFromGroup(Long cardId, Long groupId, User user) {
        BusinessCard card = cardRepository.findById(cardId)
                .orElseThrow(() -> new RuntimeException("名片不存在"));
        
        CardGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("分组不存在"));
        
        mappingRepository.deleteByCardAndGroup(card, group);
    }
    
    public Page<BusinessCard> getCardsByGroup(Long groupId, Pageable pageable) {
        return cardRepository.findByGroupId(groupId, pageable);
    }
    
    public List<BusinessCard> getCardsByContact(Long contactId) {
        return cardRepository.findByContactId(contactId);
    }
    
    public List<String> getDistinctCompanies(User user) {
        return cardRepository.findDistinctCompanies(user);
    }
    
    public List<String> getDistinctDepartments(User user) {
        return cardRepository.findDistinctDepartments(user);
    }
    
    private void logAccess(User user, AccessLog.AccessType type, String targetType, Long targetId, String targetName) {
        AccessLog log = new AccessLog();
        log.setUser(user);
        log.setAccessType(type);
        log.setTargetType(targetType);
        log.setTargetId(targetId);
        log.setTargetName(targetName);
        accessLogRepository.save(log);
    }
}
