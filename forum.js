console.log('📝 Loading forum.js...');

const getApiBase = () => {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return 'https://your-backend-name.up.railway.app';
};

const API_BASE = getApiBase();
const FORUM_API_BASE = API_BASE;
var currentForumCategory = 'all';

// Initialize forum
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Initializing forum...');
    checkAuthStatus();
    loadForumData();
    setupForumTabs();
    setupForumForms();
});

function setupForumTabs() {
    console.log('🔄 Setting up forum tabs...');
    document.querySelectorAll('.forum-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            console.log('📌 Tab clicked:', this.getAttribute('data-category'));
            
            // Remove active class from all tabs
            document.querySelectorAll('.forum-tab').forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            const category = this.getAttribute('data-category');
            currentForumCategory = category;
            loadThreadsByCategory(category);
        });
    });
}

function setupForumForms() {
    // Setup new thread form
    const newThreadForm = document.getElementById('newThreadForm');
    if (newThreadForm) {
        newThreadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewThread();
        });
        console.log('✅ New thread form setup complete');
    }
}

async function loadForumData() {
    console.log('🔄 Loading forum data...');
    await loadHotThreads();
    await loadThreadsByCategory('all');
    await updateForumStats();
}

async function loadHotThreads() {
    try {
        console.log('🔥 Loading hot threads...');
        const response = await fetch(`${FORUM_API_BASE}/posts`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let posts = await response.json();
        console.log('📝 Raw posts:', posts);
        
        // Lấy 6 bài mới nhất làm "hot threads"
        posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6);
        
        const container = document.getElementById('hotThreads');
        if (!container) {
            console.error('❌ Hot threads container not found');
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-fire" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;"></i>
                    <div>Chưa có bài viết nào.</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="hot-thread-card" onclick="viewThreadDetail(${post.id})">
                <div class="hot-thread-badge">MỚI</div>
                <div class="hot-thread-title">${post.title}</div>
                <div class="hot-thread-stats">
                    <span><i class="fas fa-user"></i> ${post.author?.full_name || 'Unknown'}</span>
                    <span><i class="far fa-calendar"></i> ${new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Hot threads loaded:', posts.length);
    } catch (error) {
        console.error('❌ Error loading hot threads:', error);
        const container = document.getElementById('hotThreads');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--warning);">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>Lỗi tải bài viết</div>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
}

async function loadThreadsByCategory(category) {
    try {
        console.log(`🔄 Loading threads for category: ${category}`);
        const url = `${FORUM_API_BASE}/posts`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        let posts = await response.json();
        console.log('📝 All posts:', posts);
        
        // Lọc theo category
        if (category !== 'all') {
            posts = posts.filter(post => post.category === category);
            console.log(`📝 Filtered posts for ${category}:`, posts);
        }
        
        // Sắp xếp bài mới nhất lên đầu
        posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        const container = document.getElementById('threadsList');
        if (!container) {
            console.error('❌ Threads list container not found');
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = `
                <div class="threads-empty">
                    <i class="fas fa-inbox"></i>
                    <h3>Chưa có bài viết nào</h3>
                    <p>Hãy là người đầu tiên đăng bài trong danh mục này!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="thread-item" onclick="viewThreadDetail(${post.id})">
                <div class="thread-info">
                    <div class="thread-icon">
                        <i class="fas fa-file-alt"></i>
                    </div>
                    <div class="thread-content">
                        <a href="javascript:void(0)" class="thread-title">${post.title}</a>
                        <div class="thread-meta">
                            <span class="thread-author"><i class="fas fa-user"></i> ${post.author?.full_name || 'Unknown'}</span>
                            <span><i class="far fa-calendar"></i> ${new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                            <span class="thread-badge ${post.category}">${getCategoryName(post.category)}</span>
                        </div>
                    </div>
                </div>
                <div class="thread-stats">
                    <span class="thread-replies">${post.comment_count || 0}</span>
                    <span>trả lời</span>
                </div>
                <div class="thread-stats">
                    <span class="thread-views">${post.view_count || 0}</span>
                    <span>lượt xem</span>
                </div>
                <div class="thread-lastpost">
                    <div>${new Date(post.updated_at || post.created_at).toLocaleDateString('vi-VN')}</div>
                    <div>bởi <span class="lastpost-author">${post.author?.full_name || 'Unknown'}</span></div>
                </div>
            </div>
        `).join('');
        
        console.log('✅ Threads loaded:', posts.length);
    } catch (error) {
        console.error('❌ Error loading threads:', error);
        const container = document.getElementById('threadsList') || document.getElementById('threadsContainer');
        if (container) {
            container.innerHTML = `
                <div class="threads-empty">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Lỗi tải bài viết</h3>
                    <p>${error.message}</p>
                    <button class="btn btn-primary" onclick="loadThreadsByCategory('${category}')" style="margin-top: 16px;">
                        <i class="fas fa-redo"></i> Thử lại
                    </button>
                </div>
            `;
        }
    }
}

async function updateForumStats() {
    try {
        console.log('🔄 Updating forum stats...');
        
        // Load users count
        const usersResponse = await fetch(`${FORUM_API_BASE}/users`);
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            document.getElementById('totalUsers').textContent = users.length.toLocaleString();
        }

        // Load posts count
        const postsResponse = await fetch(`${FORUM_API_BASE}/posts`);
        if (postsResponse.ok) {
            const posts = await postsResponse.json();
            document.getElementById('totalThreads').textContent = posts.length.toLocaleString();
            
            // Calculate total comments
            let totalComments = 0;
            for (const post of posts) {
                const commentsResponse = await fetch(`${FORUM_API_BASE}/posts/${post.id}/comments`);
                if (commentsResponse.ok) {
                    const comments = await commentsResponse.json();
                    totalComments += comments.length;
                }
            }
            document.getElementById('totalComments').textContent = totalComments.toLocaleString();
        }

        // Simulate online users
        document.getElementById('onlineUsers').textContent = (Math.floor(Math.random() * 100) + 100).toLocaleString();
        
        console.log('✅ Forum stats updated');
    } catch (error) {
        console.error('❌ Error updating stats:', error);
    }
}

// Thread management functions
async function createNewThread() {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    // 🔒 THÊM: Check if already submitting
    if (window.isSubmittingForumThread) {
        console.log('⏳ Đang xử lý bài viết, vui lòng chờ...');
        return;
    }
    
    const title = document.getElementById('threadTitle').value;
    const content = document.getElementById('threadContent').value;
    const category = document.getElementById('threadCategory').value;
    
    if (!title.trim() || !content.trim() || !category) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }
    
    try {
        // 🔒 THÊM: Set submitting flag
        window.isSubmittingForumThread = true;
        
        // 🎯 THÊM: Disable button và hiển thị loading
        const submitBtn = document.querySelector('#newThreadForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang đăng...';
        submitBtn.disabled = true;
        
        const postData = {
            title: title.trim(),
            content: content.trim(),
            category: category
        };
        
        console.log('🔄 Creating new thread:', postData);
        
        const response = await fetch(`${FORUM_API_BASE}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify(postData)
        });
        
        if (response.ok) {
            const newPost = await response.json();
            console.log('✅ Đăng bài thành công:', newPost);
            closeNewThreadModal();
            
            // RELOAD LẠI TOÀN BỘ DỮ LIỆU
            await loadForumData();
            
            alert('Đăng bài thành công!');
        } else {
            const errorData = await response.json();
            console.error('❌ Lỗi đăng bài:', errorData);
            alert('Lỗi khi đăng bài: ' + (errorData.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('🔌 Connection error:', error);
        alert('Lỗi kết nối đến server!');
    } finally {
        // 🔓 THÊM: Reset submitting flag và button state
        window.isSubmittingForumThread = false;
        
        const submitBtn = document.querySelector('#newThreadForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Đăng bài';
            submitBtn.disabled = false;
        }
    }
}

function viewThreadDetail(postId) {
    console.log('📖 Viewing thread:', postId);
    alert(`Xem chi tiết bài viết ${postId} - Tính năng đang phát triển!\n\nBạn có thể chuyển đến trang chi tiết bài viết ở đây.`);
}

// Modal functions for forum
function showNewThreadModal() {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    document.getElementById('newThreadModal').style.display = 'block';
    console.log('📝 Opening new thread modal');
}

function closeNewThreadModal() {
    document.getElementById('newThreadModal').style.display = 'none';
    // Clear form
    document.getElementById('newThreadForm').reset();
    console.log('📝 Closing new thread modal');
}

// Helper functions
function getCategoryName(category) {
    const categories = {
        'technology': 'Công nghệ',
        'math': 'Toán học',
        'language': 'Ngôn ngữ',
        'science': 'Khoa học',
        'questions': 'Hỏi đáp'
    };
    return categories[category] || 'Khác';
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

// Override showUserInfo to show new thread button
window.showUserInfoForum = function() {
    if (typeof showUserInfo === 'function') {
        showUserInfo();
    }
    const newThreadBtn = document.getElementById('newThreadBtn');
    if (newThreadBtn) newThreadBtn.style.display = 'inline-block';
};

// Override logout to hide new thread button
window.logoutForum = function() {
    if (typeof logout === 'function') {
        logout();
    }
    const newThreadBtn = document.getElementById('newThreadBtn');
    if (newThreadBtn) newThreadBtn.style.display = 'none';
};

// Close modal when clicking outside
window.onclickForum = function(event) {
    const authModal = document.getElementById('authModal');
    const newThreadModal = document.getElementById('newThreadModal');
    
    if (event.target === authModal) {
        closeAuthModal();
    }
    if (event.target === newThreadModal) {
        closeNewThreadModal();
    }
}

// Export functions for global access
window.loadForumData = loadForumData;
window.loadThreadsByCategory = loadThreadsByCategory;
window.createNewThread = createNewThread;
window.showNewThreadModal = showNewThreadModal;
window.closeNewThreadModal = closeNewThreadModal;
window.viewThreadDetail = viewThreadDetail;
