package com.retailpos.config;

import com.retailpos.entity.*;
import com.retailpos.mapper.*;
import com.retailpos.util.PasswordEncoder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Component
@Profile("h2")
@RequiredArgsConstructor
public class H2DataInitializer implements CommandLineRunner {

    private final StoreMapper storeMapper;
    private final UsersMapper usersMapper;
    private final MemberMapper memberMapper;
    private final ProductMapper productMapper;
    private final InventoryMapper inventoryMapper;
    private final MemberPriceMapper memberPriceMapper;
    private final CouponMapper couponMapper;
    private final MemberCouponMapper memberCouponMapper;
    private final PromotionRuleMapper promotionRuleMapper;

    @Override
    public void run(String... args) {
        log.info("正在初始化 H2 数据库基础数据...");

        if (storeMapper.selectCount(null) == 0) {
            initStore();
            initUsers();
            initMembers();
            initProducts();
            initInventory();
            initMemberPrices();
            initCoupons();
            initMemberCoupons();
            initPromotionRules();
            log.info("H2 数据库基础数据初始化完成！");
        } else {
            log.info("数据已存在，跳过初始化");
        }
    }

    private void initStore() {
        Store store = new Store();
        store.setStoreCode("ST001");
        store.setStoreName("测试门店");
        store.setAddress("北京市朝阳区测试路123号");
        store.setContactPhone("13800138000");
        store.setStatus("ACTIVE");
        store.setCreatedAt(LocalDateTime.now());
        store.setUpdatedAt(LocalDateTime.now());
        storeMapper.insert(store);
        log.info("创建门店: {}", store.getStoreName());
    }

    private void initUsers() {
        String passwordHash = PasswordEncoder.encode("admin123");

        Users admin = new Users();
        admin.setUsername("admin");
        admin.setPasswordHash(passwordHash);
        admin.setRealName("管理员");
        admin.setRole("MANAGER");
        admin.setStoreId(1L);
        admin.setStatus("ACTIVE");
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());
        usersMapper.insert(admin);
        log.info("创建用户: admin (店长)");

        Users clerk = new Users();
        clerk.setUsername("clerk");
        clerk.setPasswordHash(passwordHash);
        clerk.setRealName("收银员");
        clerk.setRole("CLERK");
        clerk.setStoreId(1L);
        clerk.setStatus("ACTIVE");
        clerk.setCreatedAt(LocalDateTime.now());
        clerk.setUpdatedAt(LocalDateTime.now());
        usersMapper.insert(clerk);
        log.info("创建用户: clerk (店员)");

        Users finance = new Users();
        finance.setUsername("finance");
        finance.setPasswordHash(passwordHash);
        finance.setRealName("财务");
        finance.setRole("FINANCE");
        finance.setStoreId(1L);
        finance.setStatus("ACTIVE");
        finance.setCreatedAt(LocalDateTime.now());
        finance.setUpdatedAt(LocalDateTime.now());
        usersMapper.insert(finance);
        log.info("创建用户: finance (财务)");
    }

    private void initMembers() {
        Member m1 = new Member();
        m1.setMemberCode("M001");
        m1.setPhone("13800138001");
        m1.setName("张三");
        m1.setLevel("NORMAL");
        m1.setPointsBalance(1000);
        m1.setStoredBalance(new BigDecimal("500.00"));
        m1.setStatus("ACTIVE");
        m1.setCreatedAt(LocalDateTime.now());
        m1.setUpdatedAt(LocalDateTime.now());
        memberMapper.insert(m1);

        Member m2 = new Member();
        m2.setMemberCode("M002");
        m2.setPhone("13800138002");
        m2.setName("李四");
        m2.setLevel("SILVER");
        m2.setPointsBalance(2000);
        m2.setStoredBalance(new BigDecimal("1000.00"));
        m2.setStatus("ACTIVE");
        m2.setCreatedAt(LocalDateTime.now());
        m2.setUpdatedAt(LocalDateTime.now());
        memberMapper.insert(m2);

        Member m3 = new Member();
        m3.setMemberCode("M003");
        m3.setPhone("13800138003");
        m3.setName("王五");
        m3.setLevel("GOLD");
        m3.setPointsBalance(5000);
        m3.setStoredBalance(new BigDecimal("2000.00"));
        m3.setStatus("ACTIVE");
        m3.setCreatedAt(LocalDateTime.now());
        m3.setUpdatedAt(LocalDateTime.now());
        memberMapper.insert(m3);

        log.info("创建会员数据: 3 条");
    }

    private void initProducts() {
        Product p1 = new Product();
        p1.setBarcode("6901234567891");
        p1.setProductName("可口可乐");
        p1.setStandardPrice(new BigDecimal("3.50"));
        p1.setCostPrice(new BigDecimal("2.00"));
        p1.setUnit("瓶");
        p1.setStatus("ACTIVE");
        p1.setCreatedAt(LocalDateTime.now());
        p1.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(p1);

        Product p2 = new Product();
        p2.setBarcode("6901234567892");
        p2.setProductName("康师傅冰红茶");
        p2.setStandardPrice(new BigDecimal("3.00"));
        p2.setCostPrice(new BigDecimal("1.80"));
        p2.setUnit("瓶");
        p2.setStatus("ACTIVE");
        p2.setCreatedAt(LocalDateTime.now());
        p2.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(p2);

        Product p3 = new Product();
        p3.setBarcode("6901234567893");
        p3.setProductName("脉动");
        p3.setStandardPrice(new BigDecimal("4.00"));
        p3.setCostPrice(new BigDecimal("2.50"));
        p3.setUnit("瓶");
        p3.setStatus("ACTIVE");
        p3.setCreatedAt(LocalDateTime.now());
        p3.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(p3);

        Product p4 = new Product();
        p4.setBarcode("6901234567894");
        p4.setProductName("农夫山泉");
        p4.setStandardPrice(new BigDecimal("2.00"));
        p4.setCostPrice(new BigDecimal("1.00"));
        p4.setUnit("瓶");
        p4.setStatus("ACTIVE");
        p4.setCreatedAt(LocalDateTime.now());
        p4.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(p4);

        Product p5 = new Product();
        p5.setBarcode("6901234567895");
        p5.setProductName("百事可乐");
        p5.setStandardPrice(new BigDecimal("3.50"));
        p5.setCostPrice(new BigDecimal("2.00"));
        p5.setUnit("瓶");
        p5.setStatus("ACTIVE");
        p5.setCreatedAt(LocalDateTime.now());
        p5.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(p5);

        Product p6 = new Product();
        p6.setBarcode("6901234567896");
        p6.setProductName("营养快线");
        p6.setStandardPrice(new BigDecimal("4.50"));
        p6.setCostPrice(new BigDecimal("2.80"));
        p6.setUnit("瓶");
        p6.setStatus("ACTIVE");
        p6.setCreatedAt(LocalDateTime.now());
        p6.setUpdatedAt(LocalDateTime.now());
        productMapper.insert(p6);

        log.info("创建商品数据: 6 条");
    }

    private void initInventory() {
        insertInventory(1L, 1L, 100);
        insertInventory(1L, 2L, 80);
        insertInventory(1L, 3L, 50);
        insertInventory(1L, 4L, 200);
        insertInventory(1L, 5L, 90);
        insertInventory(1L, 6L, 60);
        log.info("创建库存数据: 6 条");
    }

    private void insertInventory(Long storeId, Long productId, int quantity) {
        Inventory inventory = new Inventory();
        inventory.setStoreId(storeId);
        inventory.setProductId(productId);
        inventory.setQuantity(quantity);
        inventory.setLowStockThreshold(10);
        inventory.setCreatedAt(LocalDateTime.now());
        inventory.setUpdatedAt(LocalDateTime.now());
        inventoryMapper.insert(inventory);
    }

    private void initMemberPrices() {
        insertMemberPrice(1L, "SILVER", new BigDecimal("3.20"));
        insertMemberPrice(1L, "GOLD", new BigDecimal("3.00"));
        insertMemberPrice(2L, "SILVER", new BigDecimal("2.80"));
        insertMemberPrice(2L, "GOLD", new BigDecimal("2.60"));
        insertMemberPrice(3L, "SILVER", new BigDecimal("3.80"));
        insertMemberPrice(3L, "GOLD", new BigDecimal("3.50"));
        log.info("创建会员价格数据: 6 条");
    }

    private void insertMemberPrice(Long productId, String level, BigDecimal price) {
        MemberPrice mp = new MemberPrice();
        mp.setProductId(productId);
        mp.setMemberLevel(level);
        mp.setMemberPrice(price);
        memberPriceMapper.insert(mp);
    }

    private void initCoupons() {
        Coupon c1 = new Coupon();
        c1.setCouponCode("COUPON001");
        c1.setCouponName("新人专享券");
        c1.setCouponType("CASH");
        c1.setDiscountValue(new BigDecimal("20.00"));
        c1.setMinConsumption(new BigDecimal("100.00"));
        c1.setValidFrom(LocalDate.now());
        c1.setValidUntil(LocalDate.now().plusDays(30));
        c1.setTotalQuantity(100);
        c1.setRemainQuantity(100);
        c1.setStatus("ACTIVE");
        c1.setCreatedAt(LocalDateTime.now());
        couponMapper.insert(c1);

        Coupon c2 = new Coupon();
        c2.setCouponCode("COUPON002");
        c2.setCouponName("满减券");
        c2.setCouponType("CASH");
        c2.setDiscountValue(new BigDecimal("50.00"));
        c2.setMinConsumption(new BigDecimal("200.00"));
        c2.setValidFrom(LocalDate.now());
        c2.setValidUntil(LocalDate.now().plusDays(30));
        c2.setTotalQuantity(50);
        c2.setRemainQuantity(50);
        c2.setStatus("ACTIVE");
        c2.setCreatedAt(LocalDateTime.now());
        couponMapper.insert(c2);

        Coupon c3 = new Coupon();
        c3.setCouponCode("COUPON003");
        c3.setCouponName("无门槛券");
        c3.setCouponType("CASH");
        c3.setDiscountValue(new BigDecimal("10.00"));
        c3.setMinConsumption(new BigDecimal("0.00"));
        c3.setValidFrom(LocalDate.now());
        c3.setValidUntil(LocalDate.now().plusDays(30));
        c3.setTotalQuantity(200);
        c3.setRemainQuantity(200);
        c3.setStatus("ACTIVE");
        c3.setCreatedAt(LocalDateTime.now());
        couponMapper.insert(c3);

        log.info("创建优惠券数据: 3 条");
    }

    private void initMemberCoupons() {
        insertMemberCoupon(1L, 1L);
        insertMemberCoupon(1L, 3L);
        insertMemberCoupon(2L, 2L);
        insertMemberCoupon(3L, 1L);
        insertMemberCoupon(3L, 2L);
        insertMemberCoupon(3L, 3L);
        log.info("创建会员优惠券数据: 6 条");
    }

    private void insertMemberCoupon(Long memberId, Long couponId) {
        MemberCoupon mc = new MemberCoupon();
        mc.setMemberId(memberId);
        mc.setCouponId(couponId);
        mc.setStatus("UNUSED");
        mc.setObtainedAt(LocalDateTime.now());
        memberCouponMapper.insert(mc);
    }

    private void initPromotionRules() {
        PromotionRule r1 = new PromotionRule();
        r1.setRuleCode("RULE001");
        r1.setRuleName("满100减10");
        r1.setRuleType("FULL_CUT");
        r1.setConditionConfig("{\"minAmount\": 100}");
        r1.setActionConfig("{\"discountAmount\": 10}");
        r1.setPriority(1);
        r1.setValidFrom(LocalDateTime.now());
        r1.setValidUntil(LocalDateTime.now().plusDays(30));
        r1.setStatus("ACTIVE");
        r1.setCreatedAt(LocalDateTime.now());
        promotionRuleMapper.insert(r1);

        PromotionRule r2 = new PromotionRule();
        r2.setRuleCode("RULE002");
        r2.setRuleName("全场9折");
        r2.setRuleType("DISCOUNT");
        r2.setConditionConfig("{}");
        r2.setActionConfig("{\"discountRate\": 0.9}");
        r2.setPriority(2);
        r2.setValidFrom(LocalDateTime.now());
        r2.setValidUntil(LocalDateTime.now().plusDays(30));
        r2.setStatus("ACTIVE");
        r2.setCreatedAt(LocalDateTime.now());
        promotionRuleMapper.insert(r2);

        log.info("创建促销规则数据: 2 条");
    }
}
