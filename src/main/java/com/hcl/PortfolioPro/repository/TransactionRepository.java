package com.hcl.PortfolioPro.repository;
import com.hcl.PortfolioPro.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
	List<Transaction> findByUser_IdOrderByTimestampDesc(Long userId);
}
