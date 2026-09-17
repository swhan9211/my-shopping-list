const SUPABASE_URL =
    "https://fvassespdkfquyjtvubc.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_2Maim3pNbcjOkxT5MuQdjw_sPmbbzBr";


const db = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// let variables

let itemQuantity = 1;

let selectedStoreIds = [];

let items = [];

let selectedFilterStoreId = null;

let purchaseEvents = [];

let historyView = "item";

let stores = [];

let currentProfile = null;

let selectedDetailItem = null;

let itemDetailEditMode = false;

let editItemQuantity = 1;

let editItemStoreIds = [];


// Elements

const loginPage =
    document.getElementById("loginPage");

const mainPage =
    document.getElementById("mainPage");

const emailInput =
    document.getElementById("emailInput");

const passwordInput =
    document.getElementById("passwordInput");

const loginButton =
    document.getElementById("loginButton");

const logoutButton =
    document.getElementById("logoutButton");

const loginMessage =
    document.getElementById("loginMessage");

// const userName =
//     document.getElementById("userName");

const storeList =
    document.getElementById("storeList");

const addStoreButton =
    document.getElementById("addStoreButton");

const itemNameInput =
    document.getElementById("itemNameInput");

const quantityValue =
    document.getElementById("quantityValue");

const decreaseQuantityButton =
    document.getElementById("decreaseQuantityButton");

const increaseQuantityButton =
    document.getElementById("increaseQuantityButton");

const itemStoreList =
    document.getElementById("itemStoreList");

const saveItemButton =
    document.getElementById("saveItemButton");

const itemMessage =
    document.getElementById("itemMessage");

const shoppingList =
    document.getElementById("shoppingList");

const emptyShoppingList =
    document.getElementById("emptyShoppingList");

const purchaseHistory =
    document.getElementById("purchaseHistory");

const emptyPurchaseHistory =
    document.getElementById("emptyPurchaseHistory");

const itemHistoryButton =
    document.getElementById("itemHistoryButton");

const eventHistoryButton =
    document.getElementById("eventHistoryButton");

const listPage =
    document.getElementById("listPage");

const addPage =
    document.getElementById("addPage");

const historyPage =
    document.getElementById("historyPage");

const pageTitle =
    document.getElementById("pageTitle");

const navButtons =
    document.querySelectorAll(".nav-button");

const receiptInput =
    document.getElementById("receiptInput");

const selectReceiptButton =
    document.getElementById("selectReceiptButton");

const receiptPreview =
    document.getElementById("receiptPreview");

const receiptPreviewImage =
    document.getElementById("receiptPreviewImage");

const uploadReceiptButton =
    document.getElementById("uploadReceiptButton");

const cancelReceiptButton =
    document.getElementById("cancelReceiptButton");

const receiptMessage =
    document.getElementById("receiptMessage");

const receiptResult =
    document.getElementById("receiptResult");

const receiptStoreName =
    document.getElementById("receiptStoreName");

const receiptPurchasedAt =
    document.getElementById("receiptPurchasedAt");

const receiptResultItems =
    document.getElementById("receiptResultItems");

const receiptTotalAmount =
    document.getElementById("receiptTotalAmount");

const cancelReceiptResultButton =
    document.getElementById(
        "cancelReceiptResultButton"
    );

const confirmReceiptButton =
    document.getElementById(
        "confirmReceiptButton"
    );

const receiptStoreSelect =
    document.getElementById(
        "receiptStoreSelect"
    );

const itemDetailModal =
    document.getElementById(
        "itemDetailModal"
    );

const itemDetailTitle =
    document.getElementById(
        "itemDetailTitle"
    );

const itemDetailContent =
    document.getElementById(
        "itemDetailContent"
    );

const itemEditButton =
    document.getElementById(
        "itemEditButton"
    );

const itemDeleteButton =
    document.getElementById(
        "itemDeleteButton"
    );


let currentReceiptAnalysis = null;
let receiptMatches = [];
let receiptMatchSuggestions = [];

let selectedReceiptFile = null;
let receiptPreviewUrl = null;

// Login

async function login() {

    loginMessage.textContent = "";

    const email =
        emailInput.value.trim();

    const password =
        passwordInput.value;


    const { data, error } =
        await db.auth.signInWithPassword({
            email,
            password
        });


    if (error) {

        console.error(error);

        loginMessage.textContent =
            "로그인에 실패했습니다.";

        return;
    }


    await showMainPage(data.user);
}


// Load Current Profile

async function loadCurrentProfile(user) {

    const { data, error } =
        await db
            .from("profiles")
            .select(`
                id,
                display_name,
                household_id
            `)
            .eq("id", user.id)
            .single();


    if (error) {

        console.error(
            "프로필 조회 실패:",
            error
        );

        currentProfile = null;

        return false;
    }


    currentProfile = data;

    return true;
}


// Main Page

async function showMainPage(user) {

    const profileLoaded =
        await loadCurrentProfile(user);


    if (!profileLoaded) {

        loginMessage.textContent =
            "사용자 정보를 불러오지 못했습니다.";

        mainPage.hidden = true;
        loginPage.hidden = false;

        return;
    }


    loginPage.hidden = true;
    mainPage.hidden = false;


    await loadStores();
    await loadItems();
    await loadPurchaseHistory();
}


// Logout

async function logout() {

    const { error } =
        await db.auth.signOut();


    if (error) {

        console.error(
            "로그아웃 실패:",
            error
        );

        return;
    }


    mainPage.hidden = true;
    loginPage.hidden = false;
    currentProfile = null;

    passwordInput.value = "";
}


// Initialize

async function initialize() {

    const {
        data: { session }
    } = await db.auth.getSession();


    if (session?.user) {

        await showMainPage(
            session.user
        );

    } else {

        loginPage.hidden = false;
        mainPage.hidden = true;

    }
}


// Load Stores

async function loadStores() {

    const { data, error } =
        await db
            .from("stores")
            .select("*")
            .order("name", { ascending: true });


    if (error) {

        console.error(
            "구매처 조회 실패:",
            error
        );

        return;
    }


    renderStores(data);
    renderItemStores(data);
}


// Render Stores

function renderStores(stores) {

    storeList.innerHTML = "";


    // 전체 버튼
    const allButton =
        document.createElement("button");

    allButton.className =
        "store-tag";

    allButton.textContent =
        "전체";


    if (selectedFilterStoreId === null) {
        allButton.classList.add("selected");
    }


    allButton.addEventListener(
        "click",
        () => {

            selectedFilterStoreId = null;

            renderStores(stores);
            renderItems();
        }
    );


    storeList.appendChild(allButton);


    // 구매처 버튼
    stores.forEach(store => {

        const button =
            document.createElement("button");

        button.className =
            "store-tag";

        button.textContent =
            store.name;

        button.dataset.storeId =
            store.id;


        if (
            selectedFilterStoreId === store.id
        ) {
            button.classList.add("selected");
        }


        button.addEventListener(
            "click",
            () => {

                selectedFilterStoreId =
                    store.id;

                renderStores(stores);
                renderItems();
            }
        );


        storeList.appendChild(button);
    });
}


// Add Store

async function addStore() {

    const storeName =
        prompt("추가할 구매처를 입력해주세요.");


    if (!storeName) {
        return;
    }


    const trimmedName =
        storeName.trim();


    if (!trimmedName) {
        return;
    }


    const confirmed =
        confirm(
            `"${trimmedName}"이(가) 맞나요?`
        );


    if (!confirmed) {
        return;
    }


    const {
        data: { user },
        error: userError
    } = await db.auth.getUser();


    if (userError || !user) {

        console.error(
            "사용자 정보 조회 실패:",
            userError
        );

        return;
    }

    if (
        !currentProfile ||
        !currentProfile.household_id
    ) {

        console.error(
            "household 정보를 찾을 수 없습니다."
        );

        alert(
            "사용자 정보를 확인하지 못했습니다."
        );

        return;
    }


    const { error } =
        await db
            .from("stores")
            .insert({
                name: trimmedName,
                created_by: user.id,
                household_id:
                    currentProfile.household_id
            });


    if (error) {

        console.error(
            "구매처 등록 실패:",
            error
        );
    
    
        if (error.code === "23505") {
    
            alert(
                `"${trimmedName}"은(는) 이미 등록된 구매처입니다.`
            );
    
        } else {
    
            alert(
                "구매처를 등록하지 못했습니다."
            );
    
        }
    
    
        return;
    }


    await loadStores();
}


// Update Quantity

function updateQuantity() {
    quantityValue.textContent =
        itemQuantity;
}


// Render ItemStores

function renderItemStores(stores) {

    itemStoreList.innerHTML = "";


    stores.forEach(store => {

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "item-store-tag";

        button.textContent =
            store.name;

        button.dataset.storeId =
            store.id;


        button.addEventListener(
            "click",
            () => {

                toggleItemStore(
                    store.id,
                    button
                );

            }
        );


        itemStoreList.appendChild(
            button
        );
    });
}


// Toggle Item Store

function toggleItemStore(
    storeId,
    button
) {

    const index =
        selectedStoreIds.indexOf(
            storeId
        );


    if (index === -1) {

        selectedStoreIds.push(
            storeId
        );

        button.classList.add(
            "selected"
        );

    } else {

        selectedStoreIds.splice(
            index,
            1
        );

        button.classList.remove(
            "selected"
        );

    }
}


// Add New Item

async function saveItem() {

    itemMessage.textContent = "";


    const itemName =
        itemNameInput.value.trim();


    if (!itemName) {

        itemMessage.textContent =
            "품명을 입력해주세요.";

        return;
    }


    if (selectedStoreIds.length === 0) {

        itemMessage.textContent =
            "구매처를 하나 이상 선택해주세요.";

        return;
    }


    const {
        data: { user },
        error: userError
    } = await db.auth.getUser();

    if (
        !currentProfile ||
        !currentProfile.household_id
    ) {

        console.error(
            "household 정보를 찾을 수 없습니다."
        );

        itemMessage.textContent =
            "사용자 정보를 확인하지 못했습니다.";

        return;
    }


    if (userError || !user) {

        console.error(
            "사용자 조회 실패:",
            userError
        );

        return;
    }


    const {
        data: item,
        error: itemError
    } =
        await db
            .from("items")
            .insert({
                name: itemName,
                quantity: itemQuantity,
                created_by: user.id,
                household_id:
                    currentProfile.household_id
            })
            .select()
            .single();


    if (itemError) {

        console.error(
            "물품 등록 실패:",
            itemError
        );

        itemMessage.textContent =
            "물품을 등록하지 못했습니다.";

        return;
    }

    const itemStores =
        selectedStoreIds.map(
            storeId => ({
                item_id: item.id,
                store_id: storeId
            })
        );


    const { error: storeError } =
        await db
            .from("item_stores")
            .insert(itemStores);


    if (storeError) {

        console.error(
            "구매처 연결 실패:",
            storeError
        );

        itemMessage.textContent =
            "구매처 연결에 실패했습니다.";

        return;
    }


    resetItemForm();

    await loadItems();

    showPage("list");
}


// Reset Item Form

function resetItemForm() {

    itemNameInput.value = "";

    itemQuantity = 1;

    updateQuantity();


    selectedStoreIds = [];


    document
        .querySelectorAll(
            ".item-store-tag"
        )
        .forEach(button => {

            button.classList.remove(
                "selected"
            );

        });
}


// Load Items

async function loadItems() {

    const { data, error } =
        await db
            .from("items")
            .select(`
                *,
                profiles (
                    display_name
                ),
                item_stores (
                    store_id,
                    stores (
                        id,
                        name
                    )
                )
            `)
            .eq("purchased", false)
            .order("created_at", {
                ascending: false
            });


    if (error) {

        console.error(
            "구매 목록 조회 실패:",
            error
        );

        return;
    }


    items = data || [];

    renderItems();
}


// Render Items

function renderItems() {

    shoppingList.innerHTML = "";


    const filteredItems =
        selectedFilterStoreId === null
            ? items
            : items.filter(item =>
                item.item_stores.some(
                    itemStore =>
                        itemStore.store_id ===
                        selectedFilterStoreId
                )
            );


    if (filteredItems.length === 0) {

        emptyShoppingList.hidden = false;

        return;
    }


    emptyShoppingList.hidden = true;


    filteredItems.forEach(item => {

        const card =
            document.createElement("div");

        card.className =
            "shopping-item";


        const storeNames =
            item.item_stores
                .map(itemStore =>
                    itemStore.stores?.name
                )
                .filter(Boolean);


        card.innerHTML = `
            <div class="shopping-item-header">

                <strong>
                    ${escapeHtml(item.name)}
                </strong>

                <span>
                    × ${item.quantity}
                </span>

            </div>


            <div class="shopping-item-info-row">

                <div class="shopping-item-stores">
                    ${storeNames
                        .map(name =>
                            `<span>${escapeHtml(name)}</span>`
                        )
                        .join("")
                    }
                </div>


                <div class="shopping-item-meta">
                    ${escapeHtml(
                        item.profiles?.display_name
                        ?? "알 수 없음"
                    )}
                </div>

            </div>


            <button
                class="complete-purchase-button"
                type="button"
            >
                ✓ 구매 완료
            </button>
        `;


        const completeButton =
            card.querySelector(
                ".complete-purchase-button"
            );


        completeButton.addEventListener(
            "click",
            event => {
        
                event.stopPropagation();
        
                startCompletePurchase(item);
        
            }
        );
        
        card.addEventListener(
            "click",
            () => {
                openItemDetail(item);
            }
        );

        shoppingList.appendChild(card);
    });
}


// Start Complete Purchase

async function startCompletePurchase(item) {

    let storeId;


    // 특정 구매처로 필터링 중
    if (selectedFilterStoreId !== null) {

        storeId =
            selectedFilterStoreId;

    } else {

        // 전체 화면이라면 구매처 선택

        const stores =
            item.item_stores
                .map(itemStore =>
                    itemStore.stores
                )
                .filter(Boolean);


        if (stores.length === 1) {

            storeId =
                stores[0].id;

        } else {

            const storeText =
                stores
                    .map(
                        (store, index) =>
                            `${index + 1}. ${store.name}`
                    )
                    .join("\n");


            const input =
                prompt(
                    `구매한 곳을 선택해주세요.\n\n${storeText}`
                );


            if (!input) {
                return;
            }


            const index =
                Number(input) - 1;


            if (
                index < 0 ||
                index >= stores.length
            ) {

                alert(
                    "올바른 번호를 입력해주세요."
                );

                return;
            }


            storeId =
                stores[index].id;
        }
    }


    await completePurchase(
        item,
        storeId
    );
}


// Complete Purchase

async function completePurchase(
    item,
    storeId
) {

    const store =
        item.item_stores
            .map(itemStore =>
                itemStore.stores
            )
            .find(store =>
                store?.id === storeId
            );


    if (!store) {

        alert(
            "구매처 정보를 찾지 못했습니다."
        );

        return;
    }


    const confirmed =
        confirm(
            `"${item.name}" ×${item.quantity}\n\n` +
            `${store.name}에서 구매 완료 처리할까요?`
        );


    if (!confirmed) {
        return;
    }


    const { data, error } =
        await db.rpc(
            "complete_purchase",
            {
                p_item_id: item.id,
                p_store_id: storeId
            }
        );


    if (error) {

        console.error(
            "구매 완료 실패:",
            error
        );

        alert(
            "구매 완료 처리에 실패했습니다."
        );

        return;
    }


    await loadItems();
    await loadPurchaseHistory();
}


// Load Purchase History

async function loadPurchaseHistory() {

    const { data, error } =
        await db
            .from("purchase_events")
            .select(`
                id,
                purchased_at,
                total_amount,

                stores (
                    id,
                    name
                ),

                profiles (
                    display_name
                ),

                purchases (
                    id,
                    item_id,
                    product_name,
                    quantity,
                    original_price,
                    discount_amount,
                    final_price
                )
            `)
            .order(
                "purchased_at",
                { ascending: false }
            );


    if (error) {

        console.error(
            "구매 기록 조회 실패:",
            error
        );

        return;
    }


    purchaseEvents = data || [];

    renderPurchaseHistory();
}


// Render Purchase History

function renderPurchaseHistory() {

    purchaseHistory.innerHTML = "";


    if (purchaseEvents.length === 0) {

        emptyPurchaseHistory.hidden = false;

        return;
    }


    emptyPurchaseHistory.hidden = true;


    if (historyView === "item") {

        renderItemHistory();

    } else {

        renderEventHistory();

    }
}


// Render Item History

function renderItemHistory() {

    const purchases = [];


    purchaseEvents.forEach(event => {

        event.purchases.forEach(purchase => {

            purchases.push({
                ...purchase,

                purchased_at:
                    event.purchased_at,

                store:
                    event.stores,

                purchaser:
                    event.profiles
            });

        });

    });


    purchases.sort(
        (a, b) =>
            new Date(b.purchased_at) -
            new Date(a.purchased_at)
    );


    purchases.forEach(purchase => {

        const card =
            document.createElement("div");

        card.className =
            "history-item";

        let priceHtml = "";


        if (purchase.final_price != null) {
        
            priceHtml = `
                <div class="history-price">
        
                    ${
                        Number(
                            purchase.final_price
                        ).toLocaleString()
                    }원
        
                </div>
            `;
        }


        card.innerHTML = `
            <div class="history-item-header">

                <strong>
                    ${escapeHtml(
                        purchase.product_name
                    )}
                </strong>

                <span>
                    × ${purchase.quantity}
                </span>

            </div>

            <div class="history-item-store">
                ${
                    escapeHtml(
                        purchase.store?.name
                        ?? "구매처 미상"
                    )
                }
            </div>

            <div class="history-item-meta">
                ${
                    formatDate(
                        purchase.purchased_at
                    )
                }
                ·
                ${
                    escapeHtml(
                        purchase.purchaser
                            ?.display_name
                        ?? "알 수 없음"
                    )
                }
            </div>
        `;


        purchaseHistory.appendChild(
            card
        );
    });
}


// Render Event History

function renderEventHistory() {

    purchaseEvents.forEach(event => {

        const card =
            document.createElement("div");

        card.className =
            "history-event";


        const itemHtml =
            event.purchases
                .map(purchase => {

                    let price = "";


                    if (
                        purchase.final_price
                        != null
                    ) {

                        price =
                            `${Number(
                                purchase.final_price
                            ).toLocaleString()}원`;
                    }


                    return `
                        <div class="history-event-item">

                            <span>
                                ${escapeHtml(
                                    purchase.product_name
                                )}
                                × ${purchase.quantity}
                            </span>

                            <span>
                                ${price}
                            </span>

                        </div>
                    `;

                })
                .join("");


        let totalHtml = "";


        if (event.total_amount != null) {

            totalHtml = `
                <div class="history-event-total">

                    총 결제금액

                    <strong>
                        ${Number(
                            event.total_amount
                        ).toLocaleString()}원
                    </strong>

                </div>
            `;
        }


        card.innerHTML = `
            <div class="history-event-header">

                <strong>
                    ${escapeHtml(
                        event.stores?.name
                        ?? "구매처 미상"
                    )}
                </strong>

                <span>
                    ${formatDate(
                        event.purchased_at
                    )}
                </span>

            </div>

            <div class="history-event-items">
                ${itemHtml}
            </div>

            ${totalHtml}
        `;


        purchaseHistory.appendChild(
            card
        );
    });
}


// Update History View Buttons

function updateHistoryViewButtons() {

    itemHistoryButton.classList.toggle(
        "selected",
        historyView === "item"
    );

    eventHistoryButton.classList.toggle(
        "selected",
        historyView === "event"
    );
}


// Show Page

function showPage(pageName) {

    listPage.classList.remove("active");
    addPage.classList.remove("active");
    historyPage.classList.remove("active");


    navButtons.forEach(button => {
        button.classList.remove("active");
    });


    if (pageName === "list") {

        listPage.classList.add("active");

        pageTitle.textContent =
            "🛒 구매 목록";

    } else if (pageName === "add") {

        addPage.classList.add("active");

        pageTitle.textContent =
            "＋ 물품 추가";

    } else if (pageName === "history") {

        historyPage.classList.add("active");

        pageTitle.textContent =
            "🕘 구매 기록";

    }


    const activeButton =
        document.querySelector(
            `.nav-button[data-page="${pageName}"]`
        );


    activeButton?.classList.add("active");
}


// Reset Receipt Form

function resetReceiptForm() {

    selectedReceiptFile = null;

    receiptInput.value = "";

    if (receiptPreviewUrl) {

        URL.revokeObjectURL(
            receiptPreviewUrl
        );

        receiptPreviewUrl = null;
    }

    receiptPreviewImage.src = "";

    receiptPreview.hidden = true;

    receiptMessage.textContent = "";
}


// Upload Receipt

async function uploadReceipt() {

    if (!selectedReceiptFile) {

        alert(
            "영수증 이미지를 선택해주세요."
        );

        return;
    }

    const {
        data: { user },
        error: userError
    } =
        await db.auth.getUser();


    if (userError || !user) {

        console.error(
            "사용자 조회 실패:",
            userError
        );

        return;
    }


    uploadReceiptButton.disabled = true;

    receiptMessage.textContent =
        "영수증을 업로드하고 있습니다...";


    const extension =
        selectedReceiptFile.name
            .split(".")
            .pop()
            ?.toLowerCase()
        || "jpg";


    const fileName =
        `${crypto.randomUUID()}.${extension}`;

    const filePath =
        `${user.id}/${fileName}`;


    const { data, error } =
        await db.storage
            .from("receipts")
            .upload(
                filePath,
                selectedReceiptFile,
                {
                    contentType:
                        selectedReceiptFile.type,

                    upsert: false
                }
            );


    uploadReceiptButton.disabled = false;


    if (error) {

        console.error(
            "영수증 업로드 실패:",
            error
        );

        receiptMessage.textContent =
            "영수증 업로드에 실패했습니다.";

        return;
    }


    console.log(
        "영수증 업로드 성공:",
        data
    );
    
    
    receiptMessage.textContent =
        "영수증을 분석하고 있습니다...";
    
    
    await analyzeReceipt(
        data.path
    );
}


// Analyze Receipt

async function analyzeReceipt(
    receiptPath
) {

    const { data, error } =
        await db.functions.invoke(
            "analyze-receipt",
            {
                body: {
                    receiptPath:
                        receiptPath
                }
            }
        );


    if (error) {

        console.error(
            "영수증 분석 실패:",
            error
        );

        receiptMessage.textContent =
            "영수증 분석에 실패했습니다.";

        return;
    }


    console.log(
        "영수증 분석 결과:",
        data
    );
    
    receiptMessage.textContent =
        "영수증 분석이 완료되었습니다.";
    
    currentReceiptAnalysis = data;
    
    renderReceiptResult(data);
}


// Render Receipt Result

function renderReceiptResult(data) {

    receiptStoreName.textContent =
        data.store?.name
        ?? "구매처 미상";

    receiptStoreSelect.innerHTML = "";


    const emptyOption =
        document.createElement("option");
    
    emptyOption.value = "";
    emptyOption.textContent =
        "구매처를 선택해주세요.";
    
    receiptStoreSelect.appendChild(
        emptyOption
    );
    
    
    stores.forEach(store => {
    
        const option =
            document.createElement("option");
    
        option.value =
            store.id;
    
        option.textContent =
            store.name;
    
        receiptStoreSelect.appendChild(
            option
        );
    });
    
    
    const matchedStore =
        findMatchingStore(
            data.store?.name
        );
    
    
    if (matchedStore) {
    
        receiptStoreSelect.value =
            matchedStore.id;
    }


    receiptPurchasedAt.textContent =
        data.purchasedAt
            ? formatDate(data.purchasedAt)
            : "구매일시 미상";


    receiptResultItems.innerHTML = "";


    const resultItems =
        data.items || [];

    receiptMatches =
        resultItems.map(
            (item, index) => ({
                receiptItemIndex: index,
                itemId: null
            })
        );
    
    //
    receiptMatchSuggestions =
        buildReceiptMatchSuggestions(
            resultItems
        );


    receiptMatches.forEach(
        (match, index) => {

            const autoItemId =
                receiptMatchSuggestions[index]
                    ?.autoItemId;

            if (autoItemId != null) {
                match.itemId =
                    autoItemId;
            }
        }
    );
    //

    resultItems.forEach((item, index) => {

        const row =
            document.createElement("div");

        row.className =
            "receipt-result-item";


        const info =
            document.createElement("div");

        info.className =
            "receipt-result-item-info";


        const name =
            document.createElement("strong");

        name.textContent =
            item.name ?? "상품명 미상";

        const editNameButton =
            document.createElement("button");
        
        editNameButton.type =
            "button";
        
        editNameButton.className =
            "receipt-item-name-edit";
        
        editNameButton.textContent =
            "품명 수정";
        
        
        editNameButton.addEventListener(
            "click",
            () => {
        
                enableReceiptItemNameEdit(
                    name,
                    editNameButton,
                    item,
                    index
                );
            }
        );

        const quantity =
            document.createElement("span");

        quantity.textContent =
            `수량 ${item.quantity ?? 1}`;

        
        const nameRow =
            document.createElement("div");
        
        nameRow.className =
            "receipt-item-name-row";
        
        nameRow.appendChild(name);
        
        info.appendChild(nameRow);
        info.appendChild(quantity);


        const price =
            document.createElement("div");

        price.className =
            "receipt-result-item-price";

        if (item.finalPrice != null) {

            if (
                item.discountAmount != null &&
                item.discountAmount > 0
            ) {
        
                const original =
                    document.createElement("span");
        
                original.className =
                    "receipt-original-price";
        
                original.textContent =
                    `${Number(
                        item.originalPrice
                    ).toLocaleString()}원`;
        
        
                const discount =
                    document.createElement("span");
        
                discount.className =
                    "receipt-discount";
        
                discount.textContent =
                    `-${Number(
                        item.discountAmount
                    ).toLocaleString()}원`;
        
        
                const final =
                    document.createElement("strong");
        
                final.textContent =
                    `${Number(
                        item.finalPrice
                    ).toLocaleString()}원`;
        
        
                price.appendChild(original);
                price.appendChild(discount);
                price.appendChild(final);
        
            } else {
        
                price.textContent =
                    `${Number(
                        item.finalPrice
                    ).toLocaleString()}원`;
            }
        
        } else {
        
            price.textContent =
                "가격 미상";
        }


        const itemContent =
        document.createElement("div");
    
        itemContent.className =
            "receipt-result-item-content";
        
        
        const topRow =
            document.createElement("div");
        
        topRow.className =
            "receipt-result-item-top";
        
        
        topRow.appendChild(info);
        topRow.appendChild(price);
        
        
        const matchArea =
            createReceiptMatchArea(
                item,
                index
            );
        
        
        itemContent.appendChild(topRow);
        itemContent.appendChild(matchArea);

        const editArea =
            document.createElement("div");
    
        editArea.className =
            "receipt-item-edit-area";
        
        editArea.appendChild(
            editNameButton
        );
        
        itemContent.appendChild(
            editArea
        );
        
        row.appendChild(itemContent);
        
        receiptResultItems.appendChild(row);
    });


    if (data.totalAmount != null) {

        receiptTotalAmount.textContent =
            `${Number(
                data.totalAmount
            ).toLocaleString()}원`;

    } else {

        receiptTotalAmount.textContent =
            "금액 미상";
    }


    receiptResult.hidden = false;
}


// Normalize Product Name

function normalizeProductName(name) {

    return String(name || "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^\p{L}\p{N}]/gu, "");
}


// Get Receipt Match Candidates

function getReceiptMatchCandidates(
    receiptItem
) {

    const receiptName =
        normalizeProductName(
            receiptItem.name
        );


    if (!receiptName) {
        return [];
    }


    return items
        .map(item => {

            const itemName =
                normalizeProductName(
                    item.name
                );


            const score =
                calculateProductSimilarity(
                    receiptName,
                    itemName
                );

            console.log(
                `[상품 유사도] "${receiptItem.name}" ↔ "${item.name}"`,
                score
            );


            let matchType = null;


            if (
                receiptName ===
                itemName
            ) {

                matchType =
                    "exact";

            } else if (
                receiptName.includes(
                    itemName
                ) ||
                itemName.includes(
                    receiptName
                )
            ) {

                matchType =
                    "partial";

            } else if (
                score >= 0.40
            ) {

                matchType =
                    "similar";
            }


            if (!matchType) {
                return null;
            }


            return {
                item,
                matchType,
                score
            };
        })

        .filter(Boolean)

        /*
         * 가장 비슷한 후보부터
         */
        .sort(
            (a, b) =>
                b.score - a.score
        );
}


// Build Receipt Match Suggestions

function buildReceiptMatchSuggestions(
    receiptItems
) {

    const suggestions =
        receiptItems.map(
            receiptItem => ({
                candidates:
                    getReceiptMatchCandidates(
                        receiptItem
                    ),

                autoItemId: null
            })
        );


    /*
     * 1. 완전일치는 가장 강력
     */
    suggestions.forEach(
        suggestion => {

            const exactCandidates =
                suggestion.candidates.filter(
                    candidate =>
                        candidate.matchType ===
                        "exact"
                );


            if (
                exactCandidates.length === 1
            ) {

                suggestion.autoItemId =
                    exactCandidates[0]
                        .item.id;
            }
        }
    );


    /*
     * 2. 나머지는 높은 점수일 때만
     *    자동매칭 후보로 고려
     */
    suggestions.forEach(
        (suggestion, index) => {

            if (
                suggestion.autoItemId !==
                null
            ) {
                return;
            }


            const candidates =
                suggestion.candidates;


            if (
                candidates.length === 0
            ) {
                return;
            }


            const best =
                candidates[0];

            const second =
                candidates[1];


            /*
             * 자동매칭 기준
             *
             * - 최고 후보 점수 >= 0.80
             * - 2위 후보와 충분한 차이
             */
            const highConfidence =
                best.score >= 0.80;

            const clearlyBetter =
                !second ||
                (
                    best.score -
                    second.score
                ) >= 0.15;


            if (
                !highConfidence ||
                !clearlyBetter
            ) {
                return;
            }


            /*
             * 같은 구매목록 품목이
             * 다른 영수증 상품에서도
             * 후보로 잡히는지 확인
             */
            const competingReceiptItem =
                suggestions.some(
                    (
                        otherSuggestion,
                        otherIndex
                    ) => {

                        if (
                            index ===
                            otherIndex
                        ) {
                            return false;
                        }


                        return otherSuggestion
                            .candidates
                            .some(
                                candidate =>
                                    candidate.item.id ===
                                    best.item.id &&
                                    candidate.score >=
                                        0.40
                            );
                    }
                );


            if (
                competingReceiptItem
            ) {
                return;
            }


            suggestion.autoItemId =
                best.item.id;
        }
    );


    return suggestions;
}


// Create Receipt Match Area

function createReceiptMatchArea(
    receiptItem,
    receiptItemIndex
) {

    const area =
        document.createElement("div");

    area.className =
        "receipt-match-area";


    const label =
        document.createElement("span");

    label.className =
        "receipt-match-label";

    label.textContent =
        "구매목록과 연결";


    const select =
        document.createElement("select");

    select.className =
        "receipt-match-select";


    const emptyOption =
        document.createElement("option");

    emptyOption.value = "";

    emptyOption.textContent =
        "구매목록에 없는 상품";

    select.appendChild(emptyOption);


    items.forEach(item => {

        const option =
            document.createElement("option");

        option.value =
            item.id;

        option.textContent =
            `${item.name} ×${item.quantity}`;

        select.appendChild(option);
    });


    /*
     * 자동 매칭된 상품 표시
     */
    const currentMatch =
        receiptMatches[
            receiptItemIndex
        ];


    if (currentMatch?.itemId != null) {

        select.value =
            String(currentMatch.itemId);


        const autoText =
            document.createElement("span");

        autoText.className =
            "receipt-auto-match";

        autoText.textContent =
            "✓ 자동으로 연결됨";

        area.appendChild(label);
        area.appendChild(select);
        area.appendChild(autoText);

    } else {

        area.appendChild(label);
        area.appendChild(select);


        /*
         * 자동 매칭되지 않은 경우
         * 비슷한 구매목록 추천
         */
        const suggestion =
            receiptMatchSuggestions[
                receiptItemIndex
            ];


        const candidates =
            suggestion?.candidates || [];


        if (candidates.length > 0) {

            const suggestionArea =
                document.createElement("div");

            suggestionArea.className =
                "receipt-match-suggestions";


            const suggestionLabel =
                document.createElement("span");

            suggestionLabel.textContent =
                "💡 비슷한 구매목록";


            suggestionArea.appendChild(
                suggestionLabel
            );


            candidates.forEach(
                candidate => {

                    const button =
                        document.createElement(
                            "button"
                        );

                    button.type =
                        "button";

                    button.textContent =
                        `${candidate.item.name} ×${candidate.item.quantity}` +
                        ` (${Math.round(candidate.score * 100)}%)`;


                    button.addEventListener(
                        "click",
                        () => {

                            select.value =
                                String(
                                    candidate.item.id
                                );

                            currentMatch.itemId =
                                candidate.item.id;
                        }
                    );


                    suggestionArea.appendChild(
                        button
                    );
                }
            );


            area.appendChild(
                suggestionArea
            );
        }
    }


    /*
     * 사용자가 직접 dropdown 변경
     */
    select.addEventListener(
        "change",
        () => {

            if (!select.value) {

                currentMatch.itemId =
                    null;

                return;
            }


            currentMatch.itemId =
                Number(select.value);
        }
    );


    return area;
}


// Load Stores

async function loadStores() {

    const { data, error } =
        await db
            .from("stores")
            .select("*")
            .order(
                "name",
                { ascending: true }
            );


    if (error) {
        console.error(
            "구매처 조회 실패:",
            error
        );

        return;
    }


    stores = data || [];


    renderStores(stores);
    renderItemStores(stores);
}


// Find Matching Store

function findMatchingStore(
    receiptStoreName
) {

    if (!receiptStoreName) {
        return null;
    }


    const normalizedReceiptName =
        receiptStoreName
            .replace(/\s/g, "")
            .toLowerCase();


    return stores.find(store => {

        const normalizedStoreName =
            store.name
                .replace(/\s/g, "")
                .toLowerCase();


        return (
            normalizedReceiptName.includes(
                normalizedStoreName
            ) ||
            normalizedStoreName.includes(
                normalizedReceiptName
            )
        );
    }) || null;
}


// Enable Receipt Item Name Edit

function enableReceiptItemNameEdit(
    nameElement,
    editButton,
    receiptItem,
    receiptItemIndex
) {

    /*
     * 입력창 생성
     */
    const input =
        document.createElement("input");

    input.type = "text";

    input.className =
        "receipt-item-name-input";

    input.value =
        receiptItem.name ?? "";


    /*
     * 적용 버튼 생성
     */
    const applyButton =
        document.createElement("button");

    applyButton.type = "button";

    applyButton.className =
        "receipt-item-name-apply";

    applyButton.textContent =
        "적용";


    /*
     * 기존 상품명 대신
     * input을 화면에 표시
     */
    nameElement.replaceWith(
        input
    );


    /*
     * 수정 버튼은 잠시 숨긴다.
     */
    editButton.hidden = true;

    editButton.parentElement.appendChild(
        applyButton
    );


    /*
     * 바로 입력할 수 있도록
     * 포커스
     */
    input.focus();
    input.select();


    /*
     * 수정 적용
     */
    function apply() {

        const newName =
            input.value.trim();


        if (!newName) {

            alert(
                "상품명을 입력해주세요."
            );

            return;
        }


        /*
         * 실제 영수증 분석 데이터의
         * 상품명 수정
         */
        receiptItem.name =
            newName;


        /*
         * 원래 strong 태그의
         * 텍스트 변경
         */
        nameElement.textContent =
            newName;


        /*
         * input을 다시
         * 상품명 strong으로 교체
         */
        input.replaceWith(
            nameElement
        );


        /*
         * 적용 버튼 제거
         */
        applyButton.remove();


        /*
         * 수정 버튼 다시 표시
         */
        editButton.hidden =
            false;


        /*
         * 변경된 상품명을 기준으로
         * 구매목록 매칭 다시 계산
         */
        refreshReceiptItemMatch(
            receiptItem,
            receiptItemIndex
        );
    }


    /*
     * 적용 버튼 클릭
     */
    applyButton.addEventListener(
        "click",
        apply
    );


    /*
     * Enter 키로도 적용
     */
    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                apply();
            }
        }
    );
}


// Refresh Receipt Item Match

function refreshReceiptItemMatch(
    receiptItem,
    receiptItemIndex
) {

    /*
     * 전체 영수증 상품을 기준으로
     * 추천/자동매칭을 다시 계산
     */
    receiptMatchSuggestions =
        buildReceiptMatchSuggestions(
            currentReceiptAnalysis.items || []
        );


    /*
     * 이름을 수정한 상품의
     * 기존 매칭만 초기화
     */
    receiptMatches[
        receiptItemIndex
    ].itemId = null;


    /*
     * 수정 후 확실한 자동매칭이
     * 존재한다면 적용
     */
    const autoItemId =
        receiptMatchSuggestions[
            receiptItemIndex
        ]?.autoItemId;


    if (autoItemId != null) {

        receiptMatches[
            receiptItemIndex
        ].itemId =
            autoItemId;
    }


    /*
     * 해당 영수증 상품의
     * 매칭 UI만 다시 그린다.
     */
    const rows =
        receiptResultItems
            .querySelectorAll(
                ".receipt-result-item"
            );


    const row =
        rows[receiptItemIndex];


    if (!row) {
        return;
    }


    const oldMatchArea =
        row.querySelector(
            ".receipt-match-area"
        );


    const newMatchArea =
        createReceiptMatchArea(
            receiptItem,
            receiptItemIndex
        );


    if (oldMatchArea) {

        oldMatchArea.replaceWith(
            newMatchArea
        );
    }
}

// Get Bigrams

function getBigrams(text) {

    const result = [];

    for (let i = 0; i < text.length - 1; i++) {
        result.push(
            text.slice(i, i + 2)
        );
    }

    return result;
}


// Calculate Product Similarity

function calculateProductSimilarity(
    nameA,
    nameB
) {

    const a =
        normalizeProductName(nameA);

    const b =
        normalizeProductName(nameB);


    if (!a || !b) {
        return 0;
    }


    /*
     * 완전 일치
     */
    if (a === b) {
        return 1;
    }


    /*
     * 포함 관계
     *
     * 짧은 이름이 긴 이름 대부분을
     * 설명하는 정도도 반영
     */
    if (
        a.includes(b) ||
        b.includes(a)
    ) {

        const shorter =
            Math.min(
                a.length,
                b.length
            );

        const longer =
            Math.max(
                a.length,
                b.length
            );

        const ratio =
            shorter / longer;


        return Math.min(
            0.95,
            0.75 + ratio * 0.2
        );
    }


    /*
     * 2글자 조각(bigram) 비교
     */
    const bigramsA =
        getBigrams(a);

    const bigramsB =
        getBigrams(b);


    if (
        bigramsA.length === 0 ||
        bigramsB.length === 0
    ) {
        return 0;
    }


    const remaining =
        [...bigramsB];

    let matches = 0;


    bigramsA.forEach(bigram => {

        const index =
            remaining.indexOf(
                bigram
            );

        if (index !== -1) {

            matches++;

            remaining.splice(
                index,
                1
            );
        }
    });


    const diceScore =
    (2 * matches) /
    (
        bigramsA.length +
        bigramsB.length
    );


    const shorterBigramCount =
        Math.min(
            bigramsA.length,
            bigramsB.length
        );


    const containmentScore =
        matches /
        shorterBigramCount;


/*
 * 전체적인 유사도와
 * 짧은 상품명이 얼마나 포함되는지를
 * 함께 평가
 */
return Math.max(
    diceScore,
    containmentScore * 0.85
);
}


// Open Item Detail

function openItemDetail(item) {

    selectedDetailItem = item;

    itemDetailEditMode = false;

    renderItemDetail();

    itemDetailModal.hidden = false;
}


// Render Item Detail

function renderItemDetail() {

    if (!selectedDetailItem) {
        return;
    }


    const item =
        selectedDetailItem;


    const storeNames =
        item.item_stores
            .map(itemStore =>
                itemStore.stores?.name
            )
            .filter(Boolean);


    itemDetailTitle.textContent =
        "물품 상세";


    itemDetailContent.innerHTML = "";


    /*
     * 품명
     */

    const nameRow =
        createItemDetailRow(
            "품명",
            item.name
        );


    /*
     * 수량
     */

    const quantityRow =
        createItemDetailRow(
            "수량",
            `${item.quantity}개`
        );


    /*
     * 구매처
     */

    const storeRow =
        document.createElement("div");

    storeRow.className =
        "item-detail-row";


    const storeLabel =
        document.createElement("span");

    storeLabel.textContent =
        "구매처";


    const storeValue =
        document.createElement("div");

    storeValue.className =
        "item-detail-stores";


    storeNames.forEach(name => {

        const tag =
            document.createElement("span");

        tag.textContent =
            name;

        storeValue.appendChild(tag);
    });


    storeRow.appendChild(storeLabel);
    storeRow.appendChild(storeValue);


    /*
     * 등록자
     */

    const creatorRow =
        createItemDetailRow(
            "등록자",
            item.profiles?.display_name
                ?? "알 수 없음"
        );


    itemDetailContent.appendChild(
        nameRow
    );

    itemDetailContent.appendChild(
        quantityRow
    );

    itemDetailContent.appendChild(
        storeRow
    );

    itemDetailContent.appendChild(
        creatorRow
    );


    itemEditButton.textContent =
        "수정";

    itemDeleteButton.textContent =
        "삭제";
}


// Create Item Detail Row

function createItemDetailRow(
    label,
    value
) {

    const row =
        document.createElement("div");

    row.className =
        "item-detail-row";


    const labelElement =
        document.createElement("span");

    labelElement.textContent =
        label;


    const valueElement =
        document.createElement("strong");

    valueElement.textContent =
        value;


    row.appendChild(
        labelElement
    );

    row.appendChild(
        valueElement
    );


    return row;
}


// Start Item Edit

function startItemEdit() {

    if (!selectedDetailItem) {
        return;
    }


    itemDetailEditMode = true;

    editItemQuantity =
        selectedDetailItem.quantity;


    editItemStoreIds =
        selectedDetailItem.item_stores
            .map(itemStore =>
                itemStore.store_id
            );


    renderItemEditForm();
}


// Render Item Edit Form

function renderItemEditForm() {

    const item =
        selectedDetailItem;


    itemDetailTitle.textContent =
        "물품 수정";

    itemDetailContent.innerHTML = "";


    /*
     * 품명
     */

    const nameLabel =
        document.createElement("label");

    nameLabel.className =
        "item-edit-label";

    nameLabel.textContent =
        "품명";


    const nameInput =
        document.createElement("input");

    nameInput.id =
        "editItemNameInput";

    nameInput.className =
        "item-edit-input";

    nameInput.type =
        "text";

    nameInput.value =
        item.name;


    /*
     * 수량
     */

    const quantityLabel =
        document.createElement("label");

    quantityLabel.className =
        "item-edit-label";

    quantityLabel.textContent =
        "수량";


    const quantityContainer =
        document.createElement("div");

    quantityContainer.className =
        "item-edit-quantity";


    const decreaseButton =
        document.createElement("button");

    decreaseButton.type =
        "button";

    decreaseButton.textContent =
        "−";


    const quantityValue =
        document.createElement("span");

    quantityValue.id =
        "editQuantityValue";

    quantityValue.textContent =
        editItemQuantity;


    const increaseButton =
        document.createElement("button");

    increaseButton.type =
        "button";

    increaseButton.textContent =
        "+";


    decreaseButton.addEventListener(
        "click",
        () => {

            if (editItemQuantity > 1) {
                editItemQuantity--;
            }

            quantityValue.textContent =
                editItemQuantity;
        }
    );


    increaseButton.addEventListener(
        "click",
        () => {

            editItemQuantity++;

            quantityValue.textContent =
                editItemQuantity;
        }
    );


    quantityContainer.appendChild(
        decreaseButton
    );

    quantityContainer.appendChild(
        quantityValue
    );

    quantityContainer.appendChild(
        increaseButton
    );


    /*
     * 구매처
     */

    const storeLabel =
        document.createElement("label");

    storeLabel.className =
        "item-edit-label";

    storeLabel.textContent =
        "구매처";


    const storeContainer =
        document.createElement("div");

    storeContainer.id =
        "editItemStoreList";


    itemDetailContent.appendChild(
        nameLabel
    );

    itemDetailContent.appendChild(
        nameInput
    );

    itemDetailContent.appendChild(
        quantityLabel
    );

    itemDetailContent.appendChild(
        quantityContainer
    );

    itemDetailContent.appendChild(
        storeLabel
    );

    itemDetailContent.appendChild(
        storeContainer
    );


    renderEditItemStores();


    itemEditButton.textContent =
        "수정 완료";

    itemDeleteButton.textContent =
        "취소";
}


// Render Edit Item Stores

function renderEditItemStores() {

    const container =
        document.getElementById(
            "editItemStoreList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    stores.forEach(store => {

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "item-store-tag";

        button.textContent =
            store.name;


        if (
            editItemStoreIds.includes(
                store.id
            )
        ) {
            button.classList.add(
                "selected"
            );
        }


        button.addEventListener(
            "click",
            () => {

                if (
                    editItemStoreIds.includes(
                        store.id
                    )
                ) {

                    editItemStoreIds =
                        editItemStoreIds.filter(
                            id =>
                                id !== store.id
                        );

                } else {

                    editItemStoreIds.push(
                        store.id
                    );
                }


                renderEditItemStores();
            }
        );


        container.appendChild(
            button
        );
    });
}


// Update Selected Item

async function updateSelectedItem() {

    if (!selectedDetailItem) {
        return;
    }


    const nameInput =
        document.getElementById(
            "editItemNameInput"
        );


    const itemName =
        nameInput.value.trim();


    if (!itemName) {

        alert(
            "품명을 입력해주세요."
        );

        return;
    }


    if (
        editItemStoreIds.length === 0
    ) {

        alert(
            "구매처를 하나 이상 선택해주세요."
        );

        return;
    }


    itemEditButton.disabled = true;


    const { error } =
        await db.rpc(
            "update_item",
            {
                p_item_id:
                    selectedDetailItem.id,

                p_name:
                    itemName,

                p_quantity:
                    editItemQuantity,

                p_store_ids:
                    editItemStoreIds
            }
        );


    itemEditButton.disabled = false;


    if (error) {

        console.error(
            "물품 수정 실패:",
            error
        );

        alert(
            "물품을 수정하지 못했습니다."
        );

        return;
    }


    closeItemDetail();

    await loadItems();
}


// Delete Selected Item

async function deleteSelectedItem() {

    if (!selectedDetailItem) {
        return;
    }


    const confirmed =
        confirm(
            `"${selectedDetailItem.name}"을(를) 삭제할까요?`
        );


    if (!confirmed) {
        return;
    }


    itemDeleteButton.disabled = true;


    const { error } =
        await db.rpc(
            "delete_item",
            {
                p_item_id:
                    selectedDetailItem.id
            }
        );


    itemDeleteButton.disabled = false;


    if (error) {

        console.error(
            "물품 삭제 실패:",
            error
        );

        alert(
            "물품을 삭제하지 못했습니다."
        );

        return;
    }


    closeItemDetail();

    await loadItems();
}

// Close Item Detail

function closeItemDetail() {

    itemDetailModal.hidden =
        true;

    selectedDetailItem =
        null;

    itemDetailEditMode =
        false;

    editItemQuantity =
        1;

    editItemStoreIds =
        [];
}
// Escape HTML

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// Format Date

function formatDate(dateString) {

    const date =
        new Date(dateString);


    return date.toLocaleString(
        "ko-KR",
        {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


// Events

loginButton.addEventListener(
    "click",
    login
);

logoutButton.addEventListener(
    "click",
    logout
);

addStoreButton.addEventListener(
    "click",
    addStore
);

saveItemButton.addEventListener(
    "click",
    saveItem
);

increaseQuantityButton.addEventListener(
    "click",
    () => {

        itemQuantity++;

        updateQuantity();
    }
);

decreaseQuantityButton.addEventListener(
    "click",
    () => {

        if (itemQuantity > 1) {
            itemQuantity--;
        }

        updateQuantity();
    }
);

itemHistoryButton.addEventListener(
    "click",
    () => {

        historyView = "item";

        updateHistoryViewButtons();

        renderPurchaseHistory();
    }
);

eventHistoryButton.addEventListener(
    "click",
    () => {

        historyView = "event";

        updateHistoryViewButtons();

        renderPurchaseHistory();
    }
);

navButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            showPage(
                button.dataset.page
            );

        }
    );

});

selectReceiptButton.addEventListener(
    "click",
    () => {
        receiptInput.click();
    }
);

receiptInput.addEventListener(
    "change",
    () => {

        const file =
            receiptInput.files[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {

            alert(
                "이미지 파일을 선택해주세요."
            );

            receiptInput.value = "";

            return;
        }

        selectedReceiptFile = file;

        if (receiptPreviewUrl) {
            URL.revokeObjectURL(
                receiptPreviewUrl
            );
        }

        receiptPreviewUrl =
            URL.createObjectURL(file);

        receiptPreviewImage.src =
            receiptPreviewUrl;

        receiptPreview.hidden = false;

        receiptMessage.textContent = "";
    }
);

cancelReceiptButton.addEventListener(
    "click",
    resetReceiptForm
);

uploadReceiptButton.addEventListener(
    "click",
    uploadReceipt
);

cancelReceiptResultButton.addEventListener(
    "click",
    () => {

        currentReceiptAnalysis = null;
        receiptMatches = [];

        receiptResult.hidden = true;

        receiptResultItems.innerHTML = "";

        resetReceiptForm();
    }
);

confirmReceiptButton.addEventListener(
    "click",
    async () => {

        if (!currentReceiptAnalysis) {
            return;
        }


        /*
         * 구매처 확인
         */
        if (!receiptStoreSelect.value) {
            alert("구매처를 선택해주세요.");
            return;
        }

        const storeId =
            Number(receiptStoreSelect.value);


        /*
         * 구매목록과 매칭된 품목
         */
        const selectedMatches =
            receiptMatches.filter(
                match =>
                    match.itemId !== null
            );


        /*
         * 하나의 구매목록 품목을
         * 여러 영수증 상품에 연결했는지 검사
         */
        const itemIds =
            selectedMatches.map(
                match => match.itemId
            );

        const uniqueItemIds =
            new Set(itemIds);

        if (
            uniqueItemIds.size !==
            itemIds.length
        ) {
            alert(
                "하나의 구매목록 품목을 여러 영수증 상품에 연결할 수 없습니다."
            );
            return;
        }


        /*
         * 영수증의 모든 상품을 RPC용 데이터로 변환
         */
        const purchases =
            (currentReceiptAnalysis.items || [])
                .map(
                    (receiptItem, index) => {

                        const match =
                            receiptMatches[index];

                        return {
                            itemId:
                                match?.itemId ?? null,

                            name:
                                receiptItem.name,

                            quantity:
                                receiptItem.quantity ?? 1,

                            originalPrice:
                                receiptItem.originalPrice ?? null,

                            discountAmount:
                                receiptItem.discountAmount ?? null,

                            finalPrice:
                                receiptItem.finalPrice ?? null
                        };
                    }
                );


        if (purchases.length === 0) {
            alert(
                "영수증에 구매 상품이 없습니다."
            );
            return;
        }


        const confirmed =
            confirm(
                `이 영수증을 구매 완료 처리할까요?\n\n` +
                `영수증 상품: ${purchases.length}개\n` +
                `구매목록 매칭: ${selectedMatches.length}개`
            );


        if (!confirmed) {
            return;
        }


        /*
         * 중복 클릭 방지
         */
        confirmReceiptButton.disabled = true;

        receiptMessage.textContent =
            "구매 내역을 저장하고 있습니다...";


        try {

            const {
                data: eventId,
                error
            } = await db.rpc(
                "complete_receipt_purchase",
                {
                    p_store_id:
                        storeId,

                    p_purchased_at:
                        currentReceiptAnalysis
                            .purchasedAt ?? null,

                    p_receipt_path:
                        currentReceiptAnalysis
                            .receiptPath ?? null,

                    p_total_amount:
                        currentReceiptAnalysis
                            .totalAmount ?? null,

                    p_purchases:
                        purchases
                }
            );


            if (error) {
                throw error;
            }


            console.log(
                "영수증 구매 완료:",
                {
                    eventId,
                    purchases
                }
            );


            /*
             * 화면 데이터 새로고침
             */
            await loadItems();
            await loadPurchaseHistory();


            /*
             * 영수증 화면 초기화
             */
            currentReceiptAnalysis = null;
            receiptMatches = [];

            receiptResult.hidden = true;
            receiptResultItems.innerHTML = "";

            resetReceiptForm();


            alert(
                "구매 완료 처리되었습니다."
            );

        } catch (error) {

            console.error(
                "영수증 구매 완료 처리 실패:",
                error
            );

            receiptMessage.textContent =
                "구매 완료 처리에 실패했습니다.";

            alert(
                "구매 완료 처리 중 오류가 발생했습니다."
            );

        } finally {

            confirmReceiptButton.disabled =
                false;
        }
    }
);

itemEditButton.addEventListener(
    "click",
    async () => {

        if (itemDetailEditMode) {

            await updateSelectedItem();

        } else {

            startItemEdit();
        }
    }
);


itemDeleteButton.addEventListener(
    "click",
    async () => {

        if (itemDetailEditMode) {

            itemDetailEditMode =
                false;

            renderItemDetail();

        } else {

            await deleteSelectedItem();
        }
    }
);

itemDetailModal.addEventListener(
    "click",
    event => {

        if (
            event.target ===
                itemDetailModal &&
            !itemDetailEditMode
        ) {

            closeItemDetail();
        }
    }
);


// Start

initialize();