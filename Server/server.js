const express = require('express');
const bodyParser = require('body-parser'); // 引入 body-parser 中间件
const cors = require('cors');
const { MongoClient } = require('mongodb');

// 创建 Express 应用程序
const app = express();
const port = 3000;

// 启用中间件
app.use(bodyParser.json()); // 解析 JSON 请求体
app.use(bodyParser.urlencoded({ extended: true })); // 解析 URL 编码请求体
app.use(cors());

// MongoDB 连接字符串和数据库名称
const uri = 'mongodb://10.8.8.108:27017';
const dbName = 'RandomLaunch';

// 用户登录的路由
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();

    const database = client.db(dbName);
    const collection = database.collection('user');
    // console.log(collection);
    console.log(`username: ${username}, password: ${password}`);
    const user = await collection.findOne({ ID: username, PASSWORD: password });
    if (user) {
      // 登录成功
      res.json({ success: true });
    } else {
      // 登录失败
      res.json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// 查询所有数据的路由
app.get('/data', async (req, res) => {
  const { username } = req.query;

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();

    const database = client.db(dbName);
    const listCollection = database.collection('list');
    const usedCollection = database.collection('used');

    const options = await listCollection.find().toArray();
    console.log(options);
    const usedOptions = await usedCollection.find({ USER: username }).toArray();
    console.log(usedOptions);
    const data = options.map(option => {
      // 本周之内是否有使用过
      const isUsed = usedOptions.some(usedOption => {
        // 找到时间为本周的列
        if (isThisWeek(usedOption.TIME)) {
          return usedOption.ID === option.ID;
        }
        return false;
      });
      // 遍历查找最新的条目
      const latestTime = usedOptions.reduce((latest, usedOption) => {
        if (usedOption.ID === option.ID) {
          if (!latest || usedOption.TIME > latest) {
            return usedOption.TIME;
          }
        }
        return latest;
      }, null);

      return {
        ID: option.ID,
        NAME: option.NAME,
        USED: isUsed,
        TIME: latestTime ? new Date(latestTime) : latestTime
      };
    });

    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// 写入数据的路由
app.post('/write', async (req, res) => {
  const { username, id } = req.body;

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();

    const database = client.db(dbName);
    const usedCollection = database.collection('used');

    const currentTime = Date.now();
    const data = {
      USER: username,
      ID: parseInt(id),
      TIME: currentTime
    };

    const result = await usedCollection.insertOne(data);
    console.log(result);
    if (result.acknowledged) {
      res.json({ success: true });
    } else {
      res.json({ success: false, message: 'Failed to write data' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred' });
  } finally {
    if (client) {
      await client.close();
    }
  }
});


function isThisWeek(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const currentWeek = getWeekNumber(today);
  const dateWeek = getWeekNumber(date);
  return currentWeek === dateWeek;
}

function getWeekNumber(date) {
  const yearStart = new Date(date.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((date - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return weekNumber;
}

// 启动服务器
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});