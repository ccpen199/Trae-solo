package com.bizcard.repository;

import com.bizcard.entity.BusinessCard;
import com.bizcard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BusinessCardRepository extends JpaRepository<BusinessCard, Long> {
    
    Page<BusinessCard> findByOwner(User owner, Pageable pageable);
    
    Page<BusinessCard> findByIsPublicTrue(Pageable pageable);
    
    @Query("SELECT b FROM BusinessCard b WHERE (b.owner = :owner OR b.isPublic = true)")
    Page<BusinessCard> findAccessibleByUser(@Param("owner") User owner, Pageable pageable);
    
    @Query("SELECT b FROM BusinessCard b WHERE " +
           "(b.owner = :owner OR b.isPublic = true) AND " +
           "(LOWER(b.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.positionName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.mobile) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<BusinessCard> searchByKeyword(@Param("owner") User owner, 
                                        @Param("keyword") String keyword, 
                                        Pageable pageable);
    
    @Query("SELECT b FROM BusinessCard b JOIN CardGroupMapping m ON b.id = m.card.id " +
           "WHERE m.group.id = :groupId")
    Page<BusinessCard> findByGroupId(@Param("groupId") Long groupId, Pageable pageable);
    
    @Query("SELECT b FROM BusinessCard b WHERE b.contact.id = :contactId")
    List<BusinessCard> findByContactId(@Param("contactId") Long contactId);
    
    @Query("SELECT DISTINCT b.companyName FROM BusinessCard b WHERE " +
           "(b.owner = :owner OR b.isPublic = true) AND b.companyName IS NOT NULL")
    List<String> findDistinctCompanies(@Param("owner") User owner);
    
    @Query("SELECT DISTINCT b.departmentName FROM BusinessCard b WHERE " +
           "(b.owner = :owner OR b.isPublic = true) AND b.departmentName IS NOT NULL")
    List<String> findDistinctDepartments(@Param("owner") User owner);
    
    void deleteByIdIn(List<Long> ids);
}
