package com.bizcard.service;

import com.bizcard.entity.CardGroup;
import com.bizcard.entity.CardGroupMapping;
import com.bizcard.entity.BusinessCard;
import com.bizcard.entity.User;
import com.bizcard.repository.CardGroupRepository;
import com.bizcard.repository.CardGroupMappingRepository;
import com.bizcard.repository.BusinessCardRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Service
public class CardGroupService {
    
    private final CardGroupRepository groupRepository;
    private final CardGroupMappingRepository mappingRepository;
    private final BusinessCardRepository cardRepository;
    
    public CardGroupService(CardGroupRepository groupRepository,
                             CardGroupMappingRepository mappingRepository,
                             BusinessCardRepository cardRepository) {
        this.groupRepository = groupRepository;
        this.mappingRepository = mappingRepository;
        this.cardRepository = cardRepository;
    }
    
    public List<CardGroup> listGroups(User user) {
        return groupRepository.findByOwnerOrCreatedBy(user, user);
    }
    
    public CardGroup getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在"));
    }
    
    @Transactional
    public CardGroup createGroup(CardGroup group, User user) {
        group.setOwner(user);
        group.setCreatedBy(user);
        return groupRepository.save(group);
    }
    
    @Transactional
    public CardGroup updateGroup(Long id, CardGroup updateGroup, User user) {
        CardGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在"));
        
        if (!user.getId().equals(Optional.ofNullable(group.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权修改此分组");
        }
        
        if (updateGroup.getName() != null) group.setName(updateGroup.getName());
        if (updateGroup.getType() != null) group.setType(updateGroup.getType());
        if (updateGroup.getDescription() != null) group.setDescription(updateGroup.getDescription());
        if (updateGroup.getSortOrder() != null) group.setSortOrder(updateGroup.getSortOrder());
        
        return groupRepository.save(group);
    }
    
    @Transactional
    public void deleteGroup(Long id, User user) {
        CardGroup group = groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("分组不存在"));
        
        if (!user.getId().equals(Optional.ofNullable(group.getOwner()).map(User::getId).orElse(null))) {
            throw new RuntimeException("无权删除此分组");
        }
        
        mappingRepository.deleteByGroup(group);
        groupRepository.delete(group);
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
    
    public Page<BusinessCard> getCardsInGroup(Long groupId, Pageable pageable) {
        return cardRepository.findByGroupId(groupId, pageable);
    }
}
