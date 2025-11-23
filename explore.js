console.log('📝 Loading index.js...');

const getApiBase = () => {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_URL) {
        return process.env.REACT_APP_API_URL;
    }
    return 'https://your-backend-name.up.railway.app';
};

const API_BASE = getApiBase();
const FORUM_API_BASE = API_BASE;
// explore.js - Left Aligned Team Section
const teamMembers = [
    {
        id: 1,
        name: "Чан Нгок Минь",
        role: "Code",
        avatar: "MA",
    },
    {
        id: 2,
        name: "До Хю Хоанг", 
        role: "Code",
        avatar: "QB",
    },
    {
        id: 3,
        name: "хз",
        role: "хз",
        avatar: "CT",
    },
    {
        id: 4,
        name: "хз",
        role: "хз", 
        avatar: "DD",
    },
    {
        id: 5,
        name: "хз",
        role: "хз",
        avatar: "ET",
    }
];

// Initialize explore page
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    loadTeamMembers();
    loadPlatformStats();
    loadTeamStats();
});

function loadTeamMembers() {
    const container = document.getElementById('teamMembers');
    
    container.innerHTML = teamMembers.map(member => `
        <div class="team-member">
            <div class="member-avatar">${member.avatar}</div>
            <div class="member-info">
                <h3 class="member-name">${member.name}</h3>
                <div class="member-role">${member.role}</div>
                <!-- XÓA toàn bộ phần member-stats -->
            </div>
        </div>
    `).join('');
}

function loadTeamStats() {
    const statsContainer = document.createElement('div');
    statsContainer.className = 'team-stats';
    statsContainer.innerHTML = `
        <div class="team-stat">
            <span class="team-stat-number">5</span>
            <span class="team-stat-label">Thành viên</span>
        </div>
        <div class="team-stat">
            <span class="team-stat-number">3+</span>
            <span class="team-stat-label">Năm kinh nghiệm</span>
        </div>
        <div class="team-stat">
            <span class="team-stat-number">50+</span>
            <span class="team-stat-label">Dự án hoàn thành</span>
        </div>
    `;
    
    // Chèn stats vào team-header
    const teamHeader = document.querySelector('.team-header');
    teamHeader.appendChild(statsContainer);
}

async function loadPlatformStats() {
    try {
        const usersResponse = await fetch(`${API_BASE}/users`);
        if (usersResponse.ok) {
            const users = await usersResponse.json();
            document.getElementById('totalMembers').textContent = users.length.toLocaleString() + '+';
        }

        const postsResponse = await fetch(`${API_BASE}/posts`);
        if (postsResponse.ok) {
            const posts = await postsResponse.json();
            document.getElementById('totalPosts').textContent = posts.length.toLocaleString() + '+';
        }

        document.getElementById('totalResources').textContent = "500+";
        
    } catch (error) {
        console.error('Error loading platform stats:', error);
    }
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
