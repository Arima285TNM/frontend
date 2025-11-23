console.log('📝 Loading forum.js...');

const getApiBase = () => {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return 'https://your-backend-name.up.railway.app';
};

const API_BASE = getApiBase();
const FORUM_API_BASE = API_BASE;

// Documents functionality - Fixed version
console.log('📄 Loading documents.js...');

// Check if variables already exist to avoid redeclaration
if (typeof window.currentDocCategory === 'undefined') {
    window.currentDocCategory = 'all';
}
if (typeof window.currentDocSort === 'undefined') {
    window.currentDocSort = 'newest';
}

// Initialize documents page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing documents page...');
    checkAuthStatus();
    loadDocuments();
    setupDocumentEvents();
});

function setupDocumentEvents() {
    console.log('🔄 Setting up document events...');
    
    try {
        // Setup filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        console.log('Found filter buttons:', filterButtons.length);
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                console.log('🎯 Filter button clicked:', this.textContent);
                
                // Remove active class
                filterButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Get category - CẬP NHẬT MAP MỚI
                const categoryMap = {
                    'Tất cả': 'all',
                    'Toán học': 'math',
                    'Vật lý': 'science', 
                    'Hóa học': 'science',
                    'Ngữ văn': 'language',
                    'Tiếng Anh': 'language',
                    'Lịch sử': 'other',
                    'Địa lý': 'other',
                    'Sinh học': 'science',
                    'Tin học': 'technology',
                    'Môn học khác': 'other'
                };
                
                const category = categoryMap[this.textContent.trim()] || 'all';
                window.currentDocCategory = category;
                filterDocuments(category);
            });
        });

        // Setup sort select
        const sortSelect = document.querySelector('.sort-select');
        console.log('Sort select found:', !!sortSelect);
        if (sortSelect) {
            sortSelect.addEventListener('change', function() {
                console.log('🔀 Sort changed:', this.value);
                window.currentDocSort = this.value;
                sortDocuments(this.value);
            });
        }

        // Setup upload button
        const uploadBtn = document.getElementById('uploadDocBtn');
        console.log('Upload button found:', !!uploadBtn);
        if (uploadBtn) {
            uploadBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('📤 Upload button clicked');
                showUploadModal();
            });
        }

        // Setup upload form
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm) {
            uploadForm.addEventListener('submit', function(e) {
                e.preventDefault();
                console.log('📝 Upload form submitted');
                uploadDocument();
            });
        }
        
        console.log('✅ Document events setup complete');
        
    } catch (error) {
        console.error('❌ Error setting up document events:', error);
    }
}

// Document management functions
async function loadDocuments(category = 'all', sort = 'newest') {
    try {
        console.log(`🔄 Loading documents from API - Category: ${category}`);
        
        const url = `${DOCUMENTS_API_BASE}/documents?category=${category}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const documents = await response.json();
        console.log('✅ Documents loaded from API:', documents);
        renderDocuments(documents);
        
    } catch (error) {
        console.error('❌ Load documents error:', error);
        // Fallback to sample data only if API is completely down
        if (error.message.includes('Failed to fetch')) {
            showSampleDocuments();
        } else {
            const container = document.getElementById('documentsContainer');
            container.innerHTML = `
                <div class="documents-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Lỗi tải tài liệu</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
}
function showSampleDocuments() {
    console.log('📝 Showing sample documents...');
    
    const sampleDocuments = [
        {
            id: 1,
            title: "Hướng dẫn Python cơ bản",
            description: "Tài liệu học Python từ cơ bản đến nâng cao",
            category: "technology",
            file_type: "pdf",
            author: { full_name: "Nguyễn Văn A" },
            download_count: 150,
            view_count: 300,
            created_at: new Date().toISOString(),
            is_new: true
        },
        {
            id: 2,
            title: "Giáo trình Toán cao cấp",
            description: "Bài giảng môn Toán cao cấp cho sinh viên",
            category: "math", 
            file_type: "doc",
            author: { full_name: "Trần Thị B" },
            download_count: 89,
            view_count: 200,
            created_at: new Date().toISOString(),
            is_new: false
        },
        {
            id: 3,
            title: "Ngữ pháp Tiếng Anh",
            description: "Tổng hợp ngữ pháp tiếng Anh đầy đủ",
            category: "language",
            file_type: "pdf",
            author: { full_name: "Lê Văn C" },
            download_count: 210,
            view_count: 450,
            created_at: new Date().toISOString(),
            is_new: true
        },
        {
            id: 4,
            title: "Vật lý đại cương",
            description: "Bài giảng vật lý đại cương phần cơ học",
            category: "science",
            file_type: "pptx",
            author: { full_name: "Phạm Thị D" },
            download_count: 75,
            view_count: 180,
            created_at: new Date().toISOString(),
            is_new: false
        }
    ];

    renderDocuments(sampleDocuments);
}

function renderDocuments(documents) {
    const container = document.getElementById('documentsContainer');
    if (!container) {
        console.error('❌ Documents container not found');
        return;
    }
    
    if (documents.length === 0) {
        container.innerHTML = `
            <div class="documents-empty">
                <i class="fas fa-folder-open"></i>
                <h3>Chưa có tài liệu nào</h3>
                <p>Hãy là người đầu tiên chia sẻ tài liệu cho cộng đồng!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = documents.map(doc => `
        <div class="document-card ${doc.category}" data-category="${doc.category}">
            <div class="document-header">
                <div class="document-icon ${getFileType(doc.file_type)}">
                    <i class="${getFileIcon(doc.file_type)}"></i>
                </div>
                <div class="document-info">
                    <h3 class="document-title">${doc.title}</h3>
                    <p class="document-description">${doc.description || 'Không có mô tả'}</p>
                    <div class="document-meta">
                        <div class="document-author">
                            <i class="fas fa-user"></i>
                            <span>${doc.author?.full_name || 'Ẩn danh'}</span>
                        </div>
                        <div class="document-stats">
                            <span><i class="fas fa-download"></i> ${doc.download_count || 0}</span>
                            <span><i class="far fa-eye"></i> ${doc.view_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="document-actions">
                <button class="btn-preview" onclick="previewDocument(${doc.id})">
                    <i class="far fa-eye"></i> Xem trước
                </button>
                <button class="btn-download" onclick="downloadDocument(${doc.id})">
                    <i class="fas fa-download"></i> Tải xuống
                </button>
            </div>
            
            ${doc.is_new ? '<div class="document-badge">MỚI</div>' : ''}
        </div>
    `).join('');
    
    console.log('✅ Documents rendered:', documents.length);
}

function filterDocuments(category) {
    console.log('🎯 Filtering documents by:', category);
    window.currentDocCategory = category;
    loadDocuments(category, window.currentDocSort);
}

function sortDocuments(sortType) {
    console.log('🔀 Sorting documents by:', sortType);
    window.currentDocSort = sortType;
    loadDocuments(window.currentDocCategory, sortType);
}

async function uploadDocument() {
    if (window.isUploadingDocument) {
        console.log('⏳ Đang tải lên, vui lòng chờ...');
        return;
    }
    
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    const title = document.getElementById('docTitle').value;
    const description = document.getElementById('docDescription').value;
    const category = document.getElementById('docCategory').value;
    const fileInput = document.getElementById('docFile');
    const file = fileInput.files[0];
    
    if (!title.trim() || !category || !file) {
        alert('Vui lòng điền đầy đủ thông tin và chọn tệp!');
        return;
    }
    
    try {
        window.isUploadingDocument = true;
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải lên...';
        submitBtn.disabled = true;
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('file', file);
        
        console.log('🔄 Uploading document to API...');
        
        const response = await fetch(`${DOCUMENTS_API_BASE}/documents/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`
            },
            body: formData
        });
        
        if (response.ok) {
            const newDocument = await response.json();
            console.log('✅ Upload document success:', newDocument);
            closeUploadModal();
            
            // Reload documents to show the new one
            await loadDocuments(window.currentDocCategory, window.currentDocSort);
            
            alert('Tải lên tài liệu thành công!');
        } else {
            const errorData = await response.json();
            console.error('❌ Upload error:', errorData);
            alert('Lỗi khi tải lên: ' + (errorData.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('🔌 Upload document error:', error);
        alert('Lỗi kết nối đến server! Vui lòng thử lại sau.');
    } finally {
        window.isUploadingDocument = false;
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Tải lên';
            submitBtn.disabled = false;
        }
    }
}

async function downloadDocument(docId) {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    console.log('📥 Downloading document:', docId);
    alert(`Tính năng download đang được hoàn thiện!\n\nTài liệu ID: ${docId}`);
}

function addNewDocumentToUI(newDoc) {
    console.log('📝 Adding new document to UI:', newDoc);
    
    const container = document.getElementById('documentsContainer');
    if (!container) return;
    
    // Tạo ID mới
    const newId = Date.now();
    
    // Tạo HTML cho document mới
    const newDocHTML = `
        <div class="document-card ${newDoc.category}" data-category="${newDoc.category}">
            <div class="document-header">
                <div class="document-icon ${getFileType(newDoc.file_type)}">
                    <i class="${getFileIcon(newDoc.file_type)}"></i>
                </div>
                <div class="document-info">
                    <h3 class="document-title">${newDoc.title}</h3>
                    <p class="document-description">${newDoc.description || 'Không có mô tả'}</p>
                    <div class="document-meta">
                        <div class="document-author">
                            <i class="fas fa-user"></i>
                            <span>${newDoc.author?.full_name || 'You'}</span>
                        </div>
                        <div class="document-stats">
                            <span><i class="fas fa-download"></i> ${newDoc.download_count || 0}</span>
                            <span><i class="far fa-eye"></i> ${newDoc.view_count || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="document-actions">
                <button class="btn-preview" onclick="previewDocument(${newId})">
                    <i class="far fa-eye"></i> Xem trước
                </button>
                <button class="btn-download" onclick="downloadDocument(${newId})">
                    <i class="fas fa-download"></i> Tải xuống
                </button>
            </div>
            
            ${newDoc.is_new ? '<div class="document-badge">MỚI</div>' : ''}
        </div>
    `;
    
    // Thêm document mới vào đầu danh sách
    if (container.querySelector('.documents-empty')) {
        container.innerHTML = newDocHTML;
    } else {
        container.insertAdjacentHTML('afterbegin', newDocHTML);
    }
    
    console.log('✅ New document added to UI');
}

function previewDocument(docId) {
    console.log('👀 Previewing document:', docId);
    alert(`Xem trước tài liệu ${docId} - Tính năng đang phát triển!\n\nTrong phiên bản thật, bạn sẽ có thể xem trước file PDF/PPT ngay trên web.`);
}

// Modal functions for documents
function showUploadModal() {
    console.log('📤 showUploadModal called');
    
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'block';
        console.log('✅ Upload modal opened');
    } else {
        console.error('❌ Upload modal not found');
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        // Clear form
        document.getElementById('uploadForm').reset();
        
        // Đảm bảo reset button state
        const submitBtn = document.querySelector('#uploadForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Tải lên';
            submitBtn.disabled = false;
        }
        
        window.isUploadingDocument = false;
        
        console.log('✅ Upload modal closed and reset');
    }
}
// Helper functions
function getFileType(fileType) {
    const typeMap = {
        'pdf': 'pdf',
        'doc': 'doc',
        'docx': 'doc',
        'ppt': 'pptx',
        'pptx': 'pptx',
        'txt': 'txt'
    };
    return typeMap[fileType?.toLowerCase()] || 'other';
}

function getFileIcon(fileType) {
    const iconMap = {
        'pdf': 'fas fa-file-pdf',
        'doc': 'fas fa-file-word',
        'docx': 'fas fa-file-word',
        'ppt': 'fas fa-file-powerpoint',
        'pptx': 'fas fa-file-powerpoint',
        'txt': 'fas fa-file-alt'
    };
    return iconMap[fileType?.toLowerCase()] || 'fas fa-file';
}

async function safeFetch(url, options = {}) {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        // Fallback to sample data or show error message
        return null;
    }
}

// Make functions globally available
window.filterDocuments = filterDocuments;
window.sortDocuments = sortDocuments;
window.uploadDocument = uploadDocument;
window.showUploadModal = showUploadModal;
window.closeUploadModal = closeUploadModal;
window.previewDocument = previewDocument;
window.downloadDocument = downloadDocument;

console.log('✅ documents.js loaded successfully');
