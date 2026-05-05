package com.bizcard.repository;

import com.bizcard.entity.BusinessCard;
import com.bizcard.entity.CardGroup;
import com.bizcard.entity.CardGroupMapping;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CardGroupMappingRepository extends JpaRepository<CardGroupMapping, Long> {
    
    Optional<CardGroupMapping> findByCardAndGroup(BusinessCard card, CardGroup group);
    
    List<CardGroupMapping> findByGroup(CardGroup group);
    
    List<CardGroupMapping> findByCard(BusinessCard card);
    
    void deleteByCardAndGroup(BusinessCard card, CardGroup group);
    
    void deleteByGroup(CardGroup group);
}
