const API_URL = 'http://localhost:3000/api';
let currentUser = null;
let currentProductId = null;

function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function clearToken() {
    localStorage.removeItem('token');
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    document.getElementById(sectionId).style.display = 'block';
}

function showLogin() {
    showSection('loginSection');
}

function showRegister() {
    showSection('registerSection');
}

function showProducts() {
    showSection('productsSection');
    loadProducts();
}

function showSearch() {
    showSection('searchSection');
}

function showProfile() {
    if (!currentUser) {
        alert('Please login first');
        showLogin();
        return;
    }
    showSection('profileSection');
    loadProfile();
}

function showAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Access denied');
        return;
    }
    showSection('adminSection');
    showAdminUsers();
}

async function login(event) {
    event.preventDefault();

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            setToken(data.token);
            currentUser = data.user;
            updateAuthUI();
            showMessage('loginMessage', 'Login successful!', 'success');
            setTimeout(() => showProducts(), 1000);
        } else {
            showMessage('loginMessage', data.error, 'error');
        }
    } catch (error) {
        showMessage('loginMessage', 'Login failed: ' + error.message, 'error');
    }
}

async function register(event) {
    event.preventDefault();

    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, role })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('registerMessage', 'Registration successful! Please login.', 'success');
            setTimeout(() => showLogin(), 2000);
        } else {
            showMessage('registerMessage', data.error, 'error');
        }
    } catch (error) {
        showMessage('registerMessage', 'Registration failed: ' + error.message, 'error');
    }
}

function logout() {
    clearToken();
    currentUser = null;
    updateAuthUI();
    showProducts();
}

function updateAuthUI() {
    if (currentUser) {
        document.getElementById('authLinks').style.display = 'none';
        document.getElementById('userLinks').style.display = 'inline';
        if (currentUser.role === 'admin') {
            document.getElementById('adminLink').style.display = 'inline';
        }
    } else {
        document.getElementById('authLinks').style.display = 'inline';
        document.getElementById('userLinks').style.display = 'none';
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        const products = await response.json();

        const productsList = document.getElementById('productsList');
        productsList.innerHTML = products.map(product => `
            <div class="product-card" onclick="showProductDetail(${product.id})">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <span class="product-category">${product.category}</span>
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load products:', error);
    }
}

async function showProductDetail(productId) {
    currentProductId = productId;
    showSection('productDetailSection');

    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const product = await response.json();

        document.getElementById('productDetail').innerHTML = `
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <span class="product-category">${product.category}</span>
        `;

        if (currentUser) {
            document.getElementById('reviewForm').style.display = 'block';
        }

        loadReviews(productId);
    } catch (error) {
        console.error('Failed to load product:', error);
    }
}

async function loadReviews(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}/reviews`);
        const reviews = await response.json();

        const reviewsList = document.getElementById('reviewsList');
        reviewsList.innerHTML = '<h3>Reviews</h3>' + reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <span class="review-author">${review.username}</span>
                    <span class="review-rating">${'⭐'.repeat(review.rating)}</span>
                </div>
                <h4 class="review-title">${review.title}</h4>
                <p class="review-content">${review.content}</p>
                ${review.image_path ? `<img src="${review.image_path}" class="review-image">` : ''}
                <p class="review-date">${new Date(review.created_at).toLocaleDateString()}</p>
                ${currentUser && (currentUser.role === 'admin' || currentUser.id === review.user_id) ?
                    `<button onclick="deleteReview(${review.id})" class="btn btn-danger">Delete</button>` : ''}
            </div>
        `).join('');
    } catch (error) {
        console.error('Failed to load reviews:', error);
    }
}

async function submitReview(event) {
    event.preventDefault();

    const formData = new FormData();
    formData.append('product_id', currentProductId);
    formData.append('rating', document.getElementById('reviewRating').value);
    formData.append('title', document.getElementById('reviewTitle').value);
    formData.append('content', document.getElementById('reviewContent').value);

    const imageFile = document.getElementById('reviewImage').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert('Review submitted successfully!');
            document.getElementById('submitReviewForm').reset();
            loadReviews(currentProductId);
        } else {
            alert('Failed to submit review: ' + data.error);
        }
    } catch (error) {
        alert('Failed to submit review: ' + error.message);
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('Review deleted successfully!');
            loadReviews(currentProductId);
        } else {
            alert('Failed to delete review: ' + data.error);
        }
    } catch (error) {
        alert('Failed to delete review: ' + error.message);
    }
}

async function searchProducts() {
    const searchTerm = document.getElementById('searchInput').value;

    try {
        const response = await fetch(`${API_URL}/search?q=${searchTerm}`);
        const products = await response.json();

        const searchResults = document.getElementById('searchResults');
        if (products.length === 0) {
            searchResults.innerHTML = '<p>No products found</p>';
        } else {
            searchResults.innerHTML = products.map(product => `
                <div class="product-card" onclick="showProductDetail(${product.id})">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <span class="product-category">${product.category}</span>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Search failed:', error);
    }
}

async function loadProfile() {
    try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}`);
        const user = await response.json();

        document.getElementById('profileInfo').innerHTML = `
            <p><strong>Username:</strong> ${user.username}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role}</p>
            <p><strong>Member since:</strong> ${new Date(user.created_at).toLocaleDateString()}</p>
        `;

        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profileRole').value = user.role;
    } catch (error) {
        console.error('Failed to load profile:', error);
    }
}

async function updateProfile(event) {
    event.preventDefault();

    const updates = {
        email: document.getElementById('profileEmail').value,
        role: document.getElementById('profileRole').value
    };

    const password = document.getElementById('profilePassword').value;
    if (password) {
        updates.password = password;
    }

    try {
        const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updates)
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('profileMessage', 'Profile updated successfully!', 'success');
            loadProfile();
        } else {
            showMessage('profileMessage', data.error, 'error');
        }
    } catch (error) {
        showMessage('profileMessage', 'Update failed: ' + error.message, 'error');
    }
}

async function showAdminUsers() {
    try {
        const response = await fetch(`${API_URL}/admin/users`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const users = await response.json();

        document.getElementById('adminContent').innerHTML = `
            <h3>All Users</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.id}</td>
                            <td>${user.username}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${new Date(user.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load users:', error);
    }
}

async function showAdminReviews() {
    try {
        const response = await fetch(`${API_URL}/admin/reviews`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        const reviews = await response.json();

        document.getElementById('adminContent').innerHTML = `
            <h3>All Reviews</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Product</th>
                        <th>User</th>
                        <th>Rating</th>
                        <th>Title</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    ${reviews.map(review => `
                        <tr>
                            <td>${review.id}</td>
                            <td>${review.product_name}</td>
                            <td>${review.username}</td>
                            <td>${'⭐'.repeat(review.rating)}</td>
                            <td>${review.title}</td>
                            <td>${new Date(review.created_at).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load reviews:', error);
    }
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.className = `message ${type}`;
}

window.onload = function() {
    const token = getToken();
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUser = {
                id: payload.id,
                username: payload.username,
                role: payload.role
            };
            updateAuthUI();
        } catch (error) {
            clearToken();
        }
    }
    loadProducts();
};
