package com.bizcard.repository;

import com.bizcard.entity.Contact;
import com.bizcard.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {
    
    List<Contact> findByOwner(User owner);
    
    @Query("SELECT c FROM Contact c WHERE c.owner = :owner OR c.createdBy = :owner")
    List<Contact> findByOwnerOrCreatedBy(@Param("owner") User owner);
    
    Optional<Contact> findByNameAndIdCard(String name, String idCard);
    
    @Query("SELECT c FROM Contact c WHERE c.name = :name AND " +
           "(c.owner = :owner OR c.createdBy = :owner)")
    Optional<Contact> findByNameAndOwner(@Param("name") String name, @Param("owner") User owner);
}
