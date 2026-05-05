package com.bizcard.repository;

import com.bizcard.entity.CardGroup;
import com.bizcard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CardGroupRepository extends JpaRepository<CardGroup, Long> {
    
    List<CardGroup> findByOwner(User owner);
    
    List<CardGroup> findByOwnerOrCreatedBy(User owner, User createdBy);
    
    List<CardGroup> findByParent(CardGroup parent);
}
