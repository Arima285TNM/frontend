console.log('🚀 StudyHub Frontend Loading...');

// Environment configuration
const getApiBase = () => {
    // For Vercel deployment
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    // For local development with backend on Railway
    return 'https://your-backend-name.up.railway.app';
};

const API_BASE = getApiBase();
const DOCUMENTS_API_BASE = API_BASE;
const FORUM_API_BASE = API_BASE;

console.log('🔗 API Base URL:', API_BASE);

let currentToken = localStorage.getItem('token');
let currentUser = null;
let currentCategory = 'all';
let currentSort = 'newest';

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Chỉ load threads nếu đang ở trang có container threads
    if (document.getElementById('threadsContainer')) {
        loadThreads();
    }
    
    setupTabs();
    
    // CHỈ thêm event listener cho form nếu tồn tại VÀ chưa có listener nào khác
    const newThreadForm = document.getElementById('newThreadForm');
    if (newThreadForm && !newThreadForm.hasAttribute('data-listener-added')) {
        newThreadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            createNewThread();
        });
        newThreadForm.setAttribute('data-listener-added', 'true');
    }
});

function switchAuthTab(tabName) {
    // Update tabs
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Update forms
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authModalTitle = document.getElementById('authModalTitle');
    
    if (loginForm && registerForm && authModalTitle) {
        loginForm.style.display = tabName === 'login' ? 'block' : 'none';
        registerForm.style.display = tabName === 'register' ? 'block' : 'none';
        authModalTitle.textContent = tabName === 'login' ? 'Đăng nhập' : 'Đăng ký';
    }
}

function showAuthModal(defaultTab = 'login') {
    switchAuthTab(defaultTab);
    document.getElementById('authModal').style.display = 'block';
}

function closeAuthModal() {
    document.getElementById('authModal').style.display = 'none';
}

async function checkAuthStatus() {
    const savedToken = localStorage.getItem('token');
    
    if (!savedToken) {
        console.log('❌ Không có token');
        resetAllLikeStatus();
        updateUIForGuest();
        return;
    }
    
    currentToken = savedToken;
    
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: { 
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showUserInfo();
            console.log('✅ Token hợp lệ, user:', currentUser.username);
            
            // Refresh like status sau khi xác thực thành công
            setTimeout(() => {
                refreshAllLikeStatus();
            }, 500);
            
        } else {
            console.log('❌ Token không hợp lệ, clearing...');
            safeLogout();
        }
    } catch (error) {
        console.error('❌ Lỗi kiểm tra auth:', error);
        // Giữ nguyên trạng thái nếu có lỗi mạng nhưng đã có user
        if (currentUser) {
            showUserInfo();
        } else {
            safeLogout();
        }
    }
}

function updateUIForGuest() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const newThreadBtn = document.getElementById('newThreadBtn');
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (newThreadBtn) newThreadBtn.style.display = 'none';
    if (uploadDocBtn) uploadDocBtn.style.display = 'none';
}


// Reset tất cả like status về trạng thái chưa like
function resetAllLikeStatus() {
    const likeIcons = document.querySelectorAll('[id^="likeIcon-"]');
    likeIcons.forEach(icon => {
        icon.textContent = '🤍';
    });
    
    const likeButtons = document.querySelectorAll('.btn-like');
    likeButtons.forEach(button => {
        button.classList.remove('liked');
    });
    
    console.log('✅ Đã reset tất cả like status');
}

// Refresh like status cho tất cả bài viết hiện có
async function refreshAllLikeStatus() {
    if (!currentToken) {
        console.log('❌ Không có token, không thể refresh like status');
        return;
    }
    
    console.log('🔄 Refreshing like status for all posts...');
    
    const likeButtons = document.querySelectorAll('.btn-like');
    const promises = [];
    
    likeButtons.forEach(button => {
        const postId = button.getAttribute('data-post-id');
        if (postId) {
            promises.push(checkLikeStatus(parseInt(postId)));
        }
    });
    
    // Chờ tất cả like status được cập nhật
    await Promise.all(promises);
    console.log('✅ Đã refresh like status cho tất cả bài viết');
}

function showUserInfo() {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const newThreadBtn = document.getElementById('newThreadBtn');
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) userMenu.style.display = 'flex';
    
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName && currentUser) userName.textContent = currentUser.username;
    if (userAvatar && currentUser) userAvatar.textContent = currentUser.username.charAt(0).toUpperCase();
    
    if (newThreadBtn) newThreadBtn.style.display = 'inline-block';
    if (uploadDocBtn) uploadDocBtn.style.display = 'inline-block';
    
    console.log('✅ Hiển thị thông tin user:', currentUser?.username);
}

async function login() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (!username || !password) {
        alert('Vui lòng nhập tên đăng nhập và mật khẩu!');
        return;
    }

    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            currentToken = data.access_token;
            localStorage.setItem('token', currentToken);
            console.log('✅ Đăng nhập thành công, token saved');
            
            // Lấy thông tin user
            await fetchUserInfo();
            closeAuthModal();
            
            // Force reload để đảm bảo like status được refresh
            console.log('🔄 Force reloading page to refresh like status...');
            
            setTimeout(() => {
                window.location.reload();
            }, 1000);
            
        } else {
            console.log('❌ Đăng nhập thất bại');
            alert('Sai tên đăng nhập hoặc mật khẩu!');
        }
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        alert('Lỗi kết nối! Vui lòng thử lại sau.');
    }
}

// Thêm hàm fetchUserInfo
async function fetchUserInfo() {
    try {
        const response = await fetch(`${API_BASE}/users/me`, {
            headers: { 
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            currentUser = await response.json();
            showUserInfo();
        } else {
            safeLogout();
        }
    } catch (error) {
        console.error('Lỗi lấy thông tin user:', error);
    }
}

async function register() {
    const userData = {
        username: document.getElementById('regUsername').value,
        email: document.getElementById('regEmail').value,
        full_name: document.getElementById('regFullName').value,
        password: document.getElementById('regPassword').value
    };

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            switchAuthTab('login');
            
            // Clear form
            document.getElementById('regUsername').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regFullName').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            const error = await response.json();
            alert('Lỗi: ' + error.detail);
        }
    } catch (error) {
        alert('Lỗi kết nối!');
    }
}

// Like & Comment Functions
async function toggleLike(postId) {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    try {
        console.log(`🔄 Toggling like for post ${postId}`);
        
        const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${currentToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Like toggled: ${result.liked ? 'LIKED' : 'UNLIKED'}`);
            updateLikeUI(postId, result.liked);
            loadLikeCount(postId);
        } else if (response.status === 401) {
            // Token hết hạn
            console.log('❌ Token expired during like');
            localStorage.removeItem('token');
            currentToken = null;
            showAuthModal('login');
        }
    } catch (error) {
        console.error('Like error:', error);
        alert('Lỗi kết nối!');
    }
}

// Hàm kiểm tra trạng thái like với retry
async function checkLikeStatus(postId, retryCount = 0) {
    if (!currentToken) {
        console.log(`❌ No token for post ${postId}, setting default not liked`);
        updateLikeUI(postId, false);
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/like-status`, {
            headers: {
                'Authorization': `Bearer ${currentToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ Like status for post ${postId}: ${data.liked}`);
            updateLikeUI(postId, data.liked);
        } else if (response.status === 401) {
            console.log(`❌ Token invalid for post ${postId}`);
            updateLikeUI(postId, false);
        } else {
            console.log(`❌ Server error for post ${postId}: ${response.status}`);
            updateLikeUI(postId, false);
        }
    } catch (error) {
        console.error(`❌ Network error checking like status for post ${postId}:`, error);
        
        // Retry mechanism
        if (retryCount < 2) {
            console.log(`🔄 Retrying like status check for post ${postId}...`);
            setTimeout(() => {
                checkLikeStatus(postId, retryCount + 1);
            }, 1000 * (retryCount + 1));
        } else {
            updateLikeUI(postId, false);
        }
    }
}

async function loadLikeCount(postId) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/likes`);
        if (response.ok) {
            const data = await response.json();
            const likeCountElement = document.getElementById(`likeCount-${postId}`);
            if (likeCountElement) {
                likeCountElement.textContent = data.likes;
            }
        }
    } catch (error) {
        console.error('Load like count error:', error);
    }
}

function updateLikeUI(postId, liked) {
    const icon = document.getElementById(`likeIcon-${postId}`);
    const button = document.querySelector(`.btn-like[data-post-id="${postId}"]`);
    
    if (!icon) {
        console.log('❌ Like icon not found for post:', postId);
        return;
    }
    
    icon.textContent = liked ? '❤️' : '🤍';
    if (button) {
        if (liked) {
            button.classList.add('liked');
        } else {
            button.classList.remove('liked');
        }
    }
    
    console.log(`✅ Updated like UI for post ${postId}: ${liked ? 'LIKED' : 'NOT LIKED'}`);
}

function showComments(postId) {
    const commentSection = document.getElementById(`commentSection-${postId}`);
    
    if (commentSection) {
        if (commentSection.style.display === 'none') {
            commentSection.style.display = 'block';
            loadComments(postId);
            loadLikeCount(postId);
        } else {
            commentSection.style.display = 'none';
        }
    }
}

async function loadComments(postId) {
    try {
        console.log('🔄 Đang tải bình luận cho post:', postId);
        
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const comments = await response.json();
        console.log('✅ Load comments success:', comments);
        
        const container = document.getElementById(`commentsList-${postId}`);
        if (!container) {
            console.error('❌ Container không tồn tại');
            return;
        }
        
        if (comments.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray);">Chưa có bình luận nào.</p>';
            return;
        }
        
        container.innerHTML = comments.map(comment => `
            <div class="comment">
                <div class="comment-header">
                    <span class="comment-author">${comment.author?.full_name || 'Ẩn danh'}</span>
                    <span class="comment-date">${new Date(comment.created_at).toLocaleString('vi-VN')}</span>
                </div>
                <div class="comment-content">${comment.content}</div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('❌ Load comments error:', error);
        const container = document.getElementById(`commentsList-${postId}`);
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; color: var(--warning); padding: 20px;">
                    <p>⚠️ Lỗi tải bình luận</p>
                    <small>${error.message}</small>
                </div>
            `;
        }
    }
}

async function addComment(postId) {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    const contentInput = document.getElementById(`commentContent-${postId}`);
    if (!contentInput) {
        console.error('❌ Comment input not found for post:', postId);
        return;
    }
    
    const content = contentInput.value;
    if (!content.trim()) {
        alert('Vui lòng nhập nội dung bình luận!');
        return;
    }
    
    try {
        console.log('🔄 Đang gửi bình luận...', { postId, content });
        
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ 
                content: content
            })
        });
        
        console.log('📨 Response status:', response.status);
        
        if (response.ok) {
            const newComment = await response.json();
            console.log('✅ Bình luận thành công:', newComment);
            
            contentInput.value = '';
            await loadComments(postId);
            
            // Cập nhật số lượng bình luận
            updateCommentCount(postId);
            
        } else {
            const errorText = await response.text();
            console.error('❌ Lỗi response:', errorText);
            
            if (response.status === 401) {
                alert('Phiên đăng nhập hết hạn! Vui lòng đăng nhập lại.');
                logout();
            } else if (response.status === 404) {
                alert('API endpoint không tồn tại! Vui lòng kiểm tra backend.');
            } else {
                alert('Lỗi khi đăng bình luận: ' + response.status);
            }
        }
    } catch (error) {
        console.error('🔌 Lỗi kết nối:', error);
        alert('Lỗi kết nối đến server! Vui lòng kiểm tra:\n1. Backend có đang chạy không?\n2. API endpoint có đúng không?');
    }
}

async function updateCommentCount(postId) {
    try {
        const response = await fetch(`${API_BASE}/posts/${postId}/comments`);
        if (response.ok) {
            const comments = await response.json();
            
            // Tìm và cập nhật số lượng bình luận trong thread-stats
            const threadCard = document.querySelector(`[data-post-id="${postId}"]`)?.closest('.thread-card');
            if (threadCard) {
                const commentCountElement = threadCard.querySelector('.thread-stats span:nth-child(2)');
                if (commentCountElement) {
                    commentCountElement.innerHTML = `<i class="far fa-comment"></i> ${comments.length}`;
                }
            }
        }
    } catch (error) {
        console.error('Update comment count error:', error);
    }
}

// Main function to load threads
async function loadThreads(category = 'all', sort = 'newest') {
    try {
        const url = `${API_BASE}/posts`;
        const response = await fetch(url);
        let posts = await response.json();
        
        // Lọc theo category
        if (category !== 'all') {
            posts = posts.filter(post => post.category === category);
        }
        
        // Sắp xếp
        if (sort === 'newest') {
            posts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (sort === 'popular') {
            // Load stats cho mỗi post để sắp xếp theo popularity
            const postsWithStats = await Promise.all(
                posts.map(async (post) => {
                    try {
                        const statsResponse = await fetch(`${API_BASE}/posts/${post.id}/stats`);
                        if (statsResponse.ok) {
                            const stats = await statsResponse.json();
                            return { ...post, ...stats };
                        }
                    } catch (error) {
                        console.error(`Error loading stats for post ${post.id}:`, error);
                    }
                    return { ...post, comment_count: 0, like_count: 0, view_count: 0 };
                })
            );
            
            posts = postsWithStats.sort((a, b) => 
                (b.comment_count + b.like_count) - (a.comment_count + a.like_count)
            );
        }
        const container = document.getElementById('threadsContainer') || document.getElementById('threadsList');
        if (!container) {
            console.log('❌ Threads container not found');
            return;
        }
        
        if (posts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 40px;">Chưa có bài viết nào. Hãy là người đầu tiên đăng bài!</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="thread-card" data-category="${post.category}">
                <div class="thread-header">
                    <a href="javascript:void(0)" class="thread-title" onclick="viewThreadDetail(${post.id})">${post.title}</a>
                    <span class="thread-badge ${post.category}">${getCategoryName(post.category)}</span>
                </div>
                <div class="thread-content">${post.content}</div>
                <div class="thread-meta">
                    <div class="thread-author">
                        <div class="author-avatar">${post.author?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>
                        <span>${post.author?.full_name || 'Unknown'}</span>
                    </div>
                    <div class="thread-stats">
                        <span><i class="far fa-eye"></i> ${post.views || 0}</span>
                        <span><i class="far fa-comment"></i> ${post.comment_count || 0}</span>
                        <span>${new Date(post.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                
                <!-- Like & Comment Actions -->
                <div class="post-actions">
                    <button class="btn-like" onclick="toggleLike(${post.id})" data-post-id="${post.id}">
                        <span class="like-icon" id="likeIcon-${post.id}">🤍</span>
                        <span class="like-count" id="likeCount-${post.id}">0</span> lượt thích
                    </button>
                    <button class="btn-comment" onclick="showComments(${post.id})">
                        <i class="far fa-comment"></i> Bình luận
                    </button>
                </div>
                
                <!-- Comment Section -->
                <div class="comment-section" id="commentSection-${post.id}" style="display: none; margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px;">
                    <h4 style="margin-bottom: 15px;"><i class="far fa-comments"></i> Bình luận</h4>
                    
                    <div class="comment-form" style="margin-bottom: 20px;">
                        <textarea 
                            id="commentContent-${post.id}" 
                            placeholder="Thêm bình luận của bạn..." 
                            style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; resize: vertical; min-height: 80px;"
                        ></textarea>
                        <button class="btn btn-primary" onclick="addComment(${post.id})" style="margin-top: 10px;">
                            <i class="fas fa-paper-plane"></i> Đăng bình luận
                        </button>
                    </div>
                    
                    <div id="commentsList-${post.id}" class="comments-list">
                        <!-- Comments will be loaded here -->
                    </div>
                </div>
            </div>
        `).join('');
        
        // Load like counts và status cho tất cả posts
        posts.forEach(post => {
            loadLikeCount(post.id);
            setTimeout(() => {
                checkLikeStatus(post.id);
            }, 100);
        });
        
        console.log('✅ Loaded threads and like status');
        
    }   catch (error) {
        console.error('Load threads error:', error);
        const container = document.getElementById('threadsContainer') || document.getElementById('threadsList');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--gray);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 16px;"></i>
                    <h3>Lỗi tải bài viết</h3>
                    <p>Vui lòng kiểm tra kết nối và thử lại</p>
                    <button class="btn btn-primary" onclick="loadThreads()" style="margin-top: 16px;">
                        <i class="fas fa-redo"></i> Thử lại
                    </button>
                </div>
            `;
        }
    }
}

// Hàm hiển thị modal tạo bài viết mới
async function createNewThread() {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    
    // 🔒 THÊM: Check if already submitting
    if (window.isSubmittingThread) {
        console.log('⏳ Đang xử lý, vui lòng chờ...');
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
        window.isSubmittingThread = true;
        
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
        
        const response = await fetch(`${API_BASE}/posts`, {
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
            
            // RELOAD LẠI DANH SÁCH BÀI VIẾT
            if (typeof loadThreads === 'function') {
                await loadThreads(currentCategory, currentSort);
            }
            if (typeof loadForumData === 'function') {
                await loadForumData();
            }
            
            alert('Đăng bài thành công!');
        } else {
            const errorData = await response.json();
            alert('Lỗi khi đăng bài: ' + (errorData.detail || 'Unknown error'));
        }
    } catch (error) {
        console.error('🔌 Connection error:', error);
        alert('Lỗi kết nối đến server!');
    } finally {
        // 🔓 THÊM: Reset submitting flag và button state
        window.isSubmittingThread = false;
        
        const submitBtn = document.querySelector('#newThreadForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = 'Đăng bài';
            submitBtn.disabled = false;
        }
    }
}

function showNewThreadModal() {
    if (!currentToken) {
        showAuthModal('login');
        return;
    }
    document.getElementById('newThreadModal').style.display = 'block';
}

function closeNewThreadModal() {
    document.getElementById('newThreadModal').style.display = 'none';
    // Clear form
    const threadForm = document.getElementById('newThreadForm');
    if (threadForm) {
        threadForm.reset();
    }
}

function safeLogout() {
    // Clear all user data
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    
    // Hide user menu, show auth buttons
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const newThreadBtn = document.getElementById('newThreadBtn');
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    if (newThreadBtn) newThreadBtn.style.display = 'none';
    if (uploadDocBtn) uploadDocBtn.style.display = 'none';
    
    // Hide dropdown if open
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    console.log('✅ Đã đăng xuất thành công');
}

function logout() {
    console.log('🔄 Logging out...');
    
    // Reset like status trước
    resetAllLikeStatus();
    
    // Clear all user data
    currentToken = null;
    currentUser = null;
    localStorage.removeItem('token');
    
    // Hide user menu, show auth buttons
    const userMenu = document.getElementById('userMenu');
    const authButtons = document.getElementById('authButtons');
    const newThreadBtn = document.getElementById('newThreadBtn');
    const uploadDocBtn = document.getElementById('uploadDocBtn');
    
    if (userMenu) userMenu.style.display = 'none';
    if (authButtons) authButtons.style.display = 'flex';
    if (newThreadBtn) newThreadBtn.style.display = 'none';
    if (uploadDocBtn) uploadDocBtn.style.display = 'none';
    
    // Hide dropdown if open
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
    
    console.log('✅ Đã đăng xuất thành công');
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function viewProfile() {
    alert('Tính năng đang phát triển!');
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

function showSettings() {
    alert('Tính năng cài đặt đang phát triển!');
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
}

// Hàm lọc theo chuyên mục
function filterByCategory(category) {
    currentCategory = category;
    loadThreads(category, currentSort);
    
    // Update active state
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Logic này có thể cần điều chỉnh tùy theo cấu trúc HTML
    const activeCard = document.querySelector(`.category-card[data-category="${category}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
}

// Hàm sắp xếp
function sortThreads(sortType) {
    currentSort = sortType;
    loadThreads(currentCategory, sortType);
}

// Hàm xem chi tiết bài viết
function viewThreadDetail(postId) {
    // Có thể mở modal chi tiết hoặc chuyển trang
    alert(`Xem chi tiết bài viết ${postId} - Tính năng đang phát triển!`);
}

// Helper function
function getCategoryName(category) {
    const categories = {
        'technology': 'Công nghệ',
        'math': 'Toán học',
        'language': 'Ngôn ngữ',
        'science': 'Khoa học',
        'questions': 'Hỏi đáp',
        '1': 'Công nghệ',
        '2': 'Toán học', 
        '3': 'Ngôn ngữ',
        '4': 'Khoa học'
    };
    return categories[category] || 'Khác';
}

function setupTabs() {
    // Setup auth modal tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchAuthTab(tabName);
        });
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const userMenu = document.getElementById('userMenu');
    const dropdown = document.getElementById('userDropdown');
    
    if (userMenu && dropdown && !userMenu.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});

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

// Close modal when clicking outside
window.onclick = function(event) {
    const authModal = document.getElementById('authModal');
    const newThreadModal = document.getElementById('newThreadModal');
    const uploadModal = document.getElementById('uploadModal');
    
    if (event.target === authModal) {
        closeAuthModal();
    }
    if (event.target === newThreadModal) {
        closeNewThreadModal();
    }
    if (event.target === uploadModal) {
        if (typeof closeUploadModal === 'function') {
            closeUploadModal();
        }
    }
}

// Utility function để kiểm tra element tồn tại
function elementExists(selector) {
    return document.querySelector(selector) !== null;
}
