/* ============================================================
   ไฟล์: script.js
   คำอธิบาย: ควบคุมการทำงานของระบบตะกร้าสินค้า, การตรวจสอบฟอร์ม, 
   และการแสดงผลเมนูแบบ Dynamic
   ============================================================ */

// [EXTRA] ใช้ Event 'DOMContentLoaded' เพื่อรอให้ HTML โหลดเสร็จสมบูรณ์ก่อน 100%
// ป้องกันปัญหา JavaScript ทำงานก่อนที่ปุ่มหรือ Element จะปรากฏบนหน้าจอ
document.addEventListener('DOMContentLoaded', () => {
    
    // ============================================================
    // ส่วนที่ 1: ระบบตะกร้าสินค้า (Advanced DOM Manipulation)
    // ============================================================
    
    // [EXTRA] ใช้ Array เป็น Data Structure เก็บข้อมูลสินค้าชั่วคราว (แทน Database)
    let cart = []; 

    // [EXTRA] ใช้ JavaScript สร้าง CSS (Inject Styles) โดยไม่ต้องไปยุ่งกับไฟล์ .css
    // ช่วยให้จัดการ Style ของ Popup ตะกร้าได้จบในไฟล์เดียว
    const style = document.createElement('style');
    style.innerHTML = `
        /* ปุ่มตะกร้าลอย */
        .cart-floating-btn {
            position: fixed; bottom: 30px; right: 30px;
            background-color: #cd6363; color: white;
            padding: 15px 25px; border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            cursor: pointer; z-index: 1000; font-size: 1.1rem;
            display: flex; align-items: center; gap: 10px;
            transition: transform 0.2s;
        }
        .cart-floating-btn:hover { transform: scale(1.05); }
        .cart-count { background: white; color: #cd6363; border-radius: 50%; padding: 2px 8px; font-weight: bold; }

        /* หน้าต่าง Popup ตะกร้า */
        .cart-modal-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); z-index: 2000;
            display: none; justify-content: center; align-items: center;
        }
        .cart-modal {
            background: white; padding: 20px; border-radius: 10px;
            width: 90%; max-width: 500px; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            font-family: sans-serif;
        }
        .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
        .cart-close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #888; }
        
        /* รายการสินค้า */
        .cart-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
        .cart-item-info { font-size: 0.9rem; }
        .cart-controls { display: flex; align-items: center; gap: 10px; }
        .qty-btn { background: #ddd; border: none; width: 25px; height: 25px; border-radius: 5px; cursor: pointer; font-weight: bold; }
        .qty-btn:hover { background: #ccc; }
        .cart-total { text-align: right; font-size: 1.2rem; font-weight: bold; margin-top: 20px; color: #cd6363; }
    `;
    document.head.appendChild(style);

    // [EXTRA] ฟังก์ชันสร้าง HTML Elements ผ่าน JavaScript (createElement)
    // ทำให้มีปุ่มตะกร้าในทุกหน้าอัตโนมัติ โดยไม่ต้องไปแก้ HTML ทีละไฟล์
    function createCartUI() {
        const cartBtn = document.createElement('div');
        cartBtn.className = 'cart-floating-btn';
        cartBtn.innerHTML = `🛒 ตะกร้า <span class="cart-count">0</span>`;
        cartBtn.onclick = openCartModal;
        document.body.appendChild(cartBtn);

        // ใช้ Template Literal (``) เพื่อเขียน HTML แทรกตัวแปรได้ง่าย
        const modalHTML = `
            <div class="cart-modal-overlay" id="cartOverlay">
                <div class="cart-modal">
                    <div class="cart-header">
                        <h3>🛒 ตะกร้าสินค้าของคุณ</h3>
                        <button class="cart-close-btn" onclick="closeCartModal()">&times;</button>
                    </div>
                    <div id="cartItemsContainer"></div>
                    <div class="cart-total" id="cartTotal">ยอดรวม: 0 บาท</div>
                    <button onclick="alert('ขอบคุณที่สั่งซื้อ! (ระบบจำลอง)')" style="width:100%; background:#cd6363; color:white; border:none; padding:10px; margin-top:15px; border-radius:5px; cursor:pointer;">ยืนยันการสั่งซื้อ</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        window.closeCartModal = () => { document.getElementById('cartOverlay').style.display = 'none'; };
    }

    function openCartModal() {
        renderCartItems();
        document.getElementById('cartOverlay').style.display = 'flex';
    }

    // 1.4 Logic การคำนวณ
    function parsePrice(priceText) {
        const cleanString = priceText.replace(/[^0-9.]/g, '');
        return parseFloat(cleanString) || 0;
    }

    // [EXTRA] Logic การคำนวณราคาและจัดการ Array
    function addToCart(name, priceText) {
        const price = parsePrice(priceText);
        const existingItem = cart.find(item => item.name === name);
        if (existingItem) {
            existingItem.qty += 1;
        } else {
            cart.push({ name: name, price: price, qty: 1 });
        }
        updateCartCount();
        
        const btn = document.querySelector('.cart-floating-btn');
        btn.style.transform = 'scale(1.2)';
        setTimeout(() => btn.style.transform = 'scale(1)', 200);
    }

    window.changeQty = (index, change) => {
        cart[index].qty += change;
        if (cart[index].qty <= 0) {
            if (confirm("ต้องการลบสินค้านี้ใช่ไหม?")) {
                cart.splice(index, 1);
            } else {
                cart[index].qty = 1;
            }
        }
        updateCartCount();
        renderCartItems();
    };

    // [EXTRA] ฟังก์ชันคำนวณยอดรวมโดยใช้ .reduce() (High-order function)
    function updateCartCount() {
        const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
        document.querySelector('.cart-count').innerText = totalQty;
    }

    function renderCartItems() {
        const container = document.getElementById('cartItemsContainer');
        const totalEl = document.getElementById('cartTotal');
        container.innerHTML = ''; 
        let grandTotal = 0;

        if (cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#888;">ยังไม่มีสินค้าในตะกร้า</p>';
        } else {
            cart.forEach((item, index) => {
                const itemTotal = item.price * item.qty;
                grandTotal += itemTotal;
                const html = `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <strong>${item.name}</strong><br>
                            ราคา: ${item.price} x ${item.qty} = ${itemTotal.toLocaleString()} บ.
                        </div>
                        <div class="cart-controls">
                            <button class="qty-btn" onclick="changeQty(${index}, -1)">-</button>
                            <span>${item.qty}</span>
                            <button class="qty-btn" onclick="changeQty(${index}, 1)">+</button>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', html);
            });
        }
        totalEl.innerText = `ยอดรวม: ${grandTotal.toLocaleString()} บาท`;
    }

    // เริ่มทำงานสร้าง UI ตะกร้า
    createCartUI();

    // ============================================================
    // ส่วนที่ 2: Event Handling (การดักจับเหตุการณ์)
    // ============================================================
    const buyButtons = document.querySelectorAll('.content-btn');
    buyButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const href = button.getAttribute('href');
            // เช็คว่าเป็นปุ่มจำลอง (#) หรือไม่
            if (href === '#' || href === '') {
                event.preventDefault(); // ป้องกันการดีดขึ้นบนสุดของหน้าเว็บ
                // [EXTRA] เทคนิค DOM Traversal: ใช้ .closest()
                // เพื่อหา "กล่องสินค้าแม่" ของปุ่มที่ถูกกด ทำให้ดึงชื่อและราคาได้ถูกต้องแม่นยำ
                const productBox = button.closest('.product-item') || button.closest('.content-item');
                if (productBox) {
                    let nameEl = productBox.querySelector('h4');
                    if (!nameEl) nameEl = productBox.querySelector('.product-detail');
                    let priceEl = productBox.querySelector('.product-left') || productBox.querySelector('.product-price');
                    const name = nameEl ? nameEl.innerText.split('\n')[0] : 'สินค้า';
                    const price = priceEl ? priceEl.innerText : '0';
                    addToCart(name, price);
                }
            }
        });
    });


    // ============================================================
    // ส่วนที่ 3: Form Validation & Error Handling
    // ============================================================
    
    const registerForm = document.getElementById('register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', (event) => {
            event.preventDefault(); // ป้องกัน Error 405

            // ตรวจสอบความถูกต้องเฉพาะหน้าสมัครสมาชิก
            const pswd = document.getElementById('pswd');
            const cpswd = document.getElementById('cpswd');
            const email = document.getElementById('email');

            // ตรวจสอบรหัสผ่าน
            if (pswd && cpswd) {
                if (pswd.value !== cpswd.value) {
                    alert('❌ รหัสผ่านไม่ตรงกัน กรุณากรอกใหม่');
                    return; 
                }
                if (pswd.value.length < 4) {
                    alert('⚠️ รหัสผ่านต้องยาวกว่า 4 ตัวอักษร');
                    return;
                }
            }
            
            // ตรวจสอบอีเมล
            if (email && email.value.trim() === '') {
                alert('⚠️ กรุณากรอกอีเมล');
                return;
            }

            // ถ้าผ่านหมด ให้ไปหน้า Success ของการสมัคร
            window.location.href = 'success.html';
        });
    }

    // --- 3.2 สำหรับหน้า "ติดต่อเรา" (Contact Form) ---
    const contactForm = document.getElementById('contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault(); // ป้องกันการเปลี่ยนหน้า

            // ดึงค่าหัวข้อ (ถ้ามีระบบ auto fill จากตะกร้า)
            const subject = document.querySelector('input[type="text"]').value;
            
            // แสดงข้อความขอบคุณแบบง่ายๆ
            alert(`✅ ทางเราได้รับข้อความเรื่อง "${subject}" เรียบร้อยแล้ว!\nเจ้าหน้าที่จะติดต่อกลับภายใน 24 ชม. ครับ`);
            
            // เคลียร์ค่าในฟอร์ม หรือกลับหน้าแรก
            contactForm.reset(); 
            window.location.href = 'index.html'; // ส่งกลับหน้าแรก
        });
    }

    // ============================================================
    // ส่วนที่ 4: Active Menu (เมนูรู้จำหน้า)
    // ============================================================
    
    // [EXTRA] เช็ค URL ปัจจุบัน เทียบกับลิงก์ในเมนู เพื่อ Highlight หน้าที่ใช้งานอยู่
    const currentLocation = location.href; // ดึงลิงก์ของหน้าปัจจุบันมา
    const menuItem = document.querySelectorAll('.menu li a');
    const menuLength = menuItem.length;

    for (let i = 0; i < menuLength; i++) {
        // ถ้าลิงก์ของเมนู ตรงกับ ลิงก์ของหน้าปัจจุบัน
        if (menuItem[i].href === currentLocation) {
            menuItem[i].className = "active"; // ใส่ class active ให้มัน
        }
    }

});