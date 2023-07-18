// app.js

const loginForm = document.getElementById('login-form');
const fetchDataButton = document.getElementById('fetch-data-button');
const dataContainer = document.getElementById('data-container');
const greetingContainer = document.getElementById('greeting-container');
const greetingText = document.getElementById('greeting');
const dataTable = document.getElementById('data-table');
const dataList = document.getElementById('data-list');
const randomButton = document.getElementById('random-button');
const decideButton = document.getElementById('decide-button');
const resultText = document.getElementById('result');
const allowRepeatsCheckbox = document.getElementById('allow-repeats');

const serverPort = 3000; // 服务器端口号
const serverIp = "10.8.8.110";

// Check if user is already logged in using cookies
const savedUsername = getCookie('username');
const savedPassword = getCookie('password');

if (savedUsername && savedPassword) {
    autoLogin(savedUsername, savedPassword);
} else {
    document.getElementById('login-container').style.display = 'block';
}

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    await login(username, password);
});

fetchDataButton.addEventListener('click', async function () {
    const username = document.getElementById('username').value;
    await fetchData(username);
});

randomButton.addEventListener('click', function () {
    const allowRepeats = allowRepeatsCheckbox.checked;
    randomizeData(allowRepeats);
});

decideButton.addEventListener('click', async function () {
    const selectedRow = dataTable.querySelector('tr.highlight');
    if (selectedRow) {
        const name = selectedRow.querySelector('td:nth-child(2)').textContent;
        setResultText(name);
        const id = selectedRow.dataset.id;
        const username = document.getElementById('username').value;
        await writeData(username, id);
    }
});

function setResultText(name) {
    resultText.textContent = `抽中的结果：${name}`;
}

async function autoLogin(username, password) {
    await login(username, password);
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
}

async function login(username, password) {
    try {
        const response = await axios.post(`http://${serverIp}:${serverPort}/login`, { username, password });
        const data = response.data;
        if (data.success) {
            // alert('Login successful');
            document.getElementById('login-container').style.display = 'none';
            greetingText.textContent = getGreeting() + ', ' + username;
            greetingContainer.style.display = 'block';
            dataContainer.style.display = 'block';
            setCookie('username', username);
            setCookie('password', password);
            await fetchData(username);
        } else {
            alert('Login failed: ' + data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred ' + error);
    }
}

async function fetchData(username) {
    try {
        const response = await axios.get(`http://${serverIp}:${serverPort}/data`, { params: { username } });
        const data = response.data;
        renderDataList(data);
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

function renderDataList(data) {
    dataList.innerHTML = '';
    const currentWeek = getWeekNumber(new Date()); // 获取当前周的周数
    data.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item.ID;
        const idCell = document.createElement('td');
        idCell.textContent = item.ID;
        const nameCell = document.createElement('td');
        nameCell.textContent = item.NAME;
        const lastUsedCell = document.createElement('td');
        lastUsedCell.textContent = item.TIME ? formatDate(item.TIME) : '没有记录';
        row.appendChild(idCell);
        row.appendChild(nameCell);
        row.appendChild(lastUsedCell);
        dataList.appendChild(row);
        console.log(currentWeek);
        console.log(item.TIME);
        if (item.TIME && getWeekNumber(new Date(item.TIME)) === currentWeek) {

            row.classList.add('used');
        }
    });
}

function getWeekNumber(date) {
    const onejan = new Date(date.getFullYear(), 0, 1);
    const millisecsInDay = 86400000;
    return Math.ceil(((date - onejan) / millisecsInDay + onejan.getDay() + 1) / 7);
}

function randomizeData(allowRepeats) {
    const rows = Array.from(dataList.querySelectorAll('tr'));
    const unusedRows = rows.filter(row => !row.classList.contains('used'));

    if (!allowRepeats && unusedRows.length === 0) {
        alert('已经没有本周没吃过的选项了呢，我帮你把√挑上了哦！');
        allowRepeatsCheckbox.checked = allowRepeats = true;

    }
    const rowsToIterate = allowRepeats ? rows : unusedRows;

    resetDataList();

    const totalLoops = 2; // 循环次数
    const rowInterval = 200; // 每行高亮的时间间隔（毫秒）
    const highlightClass = 'highlight'; // 高亮的 CSS 类名

    let currentIndex = -1;
    let loopCount = 0;

    const intervalId = setInterval(() => {
        if (loopCount === totalLoops && currentIndex >= 0) {
            const selectedRow = rowsToIterate[currentIndex];
            selectedRow.classList.add(highlightClass);
            decideButton.disabled = false;
            clearInterval(intervalId);
        } else {
            // 移除之前的高亮
            if (currentIndex >= 0) {
                const previousRow = rowsToIterate[currentIndex];
                previousRow.classList.remove(highlightClass);
            }

            // 随机选择下一个行索引
            const randomIndex = Math.floor(Math.random() * rowsToIterate.length);
            currentIndex = randomIndex;
            const selectedRow = rowsToIterate[currentIndex];
            selectedRow.classList.add(highlightClass);

            loopCount++;
        }
    }, rowInterval);
}



async function writeData(username, id) {
    try {
        const response = await axios.post(`http://${serverIp}:${serverPort}/write`, { username, id });
        const data = response.data;
        if (data.success) {
            alert('Data written successfully');
            resetDataList();
        } else {
            alert('Failed to write data');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
}

function resetDataList() {
    const rows = Array.from(dataList.querySelectorAll('tr'));
    rows.forEach(row => row.classList.remove('highlight'));
    decideButton.disabled = true;
}

function getGreeting() {
    const currentHour = new Date().getHours();
    if (currentHour >= 0 && currentHour < 11) {
        return '上午好';
    } else if (currentHour >= 11 && currentHour < 14) {
        return '中午好';
    } else if (currentHour >= 12 && currentHour < 17) {
        return '下午好';
    } else {
        return '晚上好';
    }
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}
