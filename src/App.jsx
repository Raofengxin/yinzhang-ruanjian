import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { Pie, Bar } from '@ant-design/charts';
import { v4 as uuidv4 } from 'uuid';

// 分类规则
const categoryRules = [
  { category: '主食', subcategories: ['米饭', '面条', '馒头', '包子', '饺子', '馄饨', '粥', '饼'] },
  { category: '菜品', subcategories: ['菜', '肉', '鱼', '虾', '蛋', '豆腐', '蔬菜', '水果'] },
  { category: '饮料', subcategories: ['水', '饮料', '果汁', '茶', '咖啡', '啤酒', '白酒', '红酒'] },
  { category: '零食', subcategories: ['零食', '薯片', '饼干', '糖果', '巧克力', '坚果'] },
  { category: '其他', subcategories: ['其他', '杂项'] }
];

// 自动分类函数
const categorizeItem = (itemName) => {
  for (const rule of categoryRules) {
    for (const subcategory of rule.subcategories) {
      if (itemName.includes(subcategory)) {
        return { category: rule.category, subcategory };
      }
    }
  }
  return { category: '其他', subcategory: '其他' };
};

function App() {
  // 状态管理
  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  // 语音识别钩子
  const { transcript, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition();

  // 检查浏览器是否支持语音识别
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.log('浏览器不支持语音识别');
    }
  }, [browserSupportsSpeechRecognition]);

  // 处理语音输入结果
  useEffect(() => {
    if (transcript && isListening) {
      // 尝试从语音中提取物品名称和价格
      const match = transcript.match(/(.+?)\s*([0-9]+(\.[0-9]+)?)\s*元?/);
      if (match) {
        const [, name, price] = match;
        addItem(name, parseFloat(price));
      }
    }
  }, [transcript]);

  // 添加物品
  const addItem = (name, price) => {
    if (!name || !price) return;
    
    const { category, subcategory } = categorizeItem(name);
    const newItem = {
      id: uuidv4(),
      name,
      price,
      category,
      subcategory,
      timestamp: new Date().toISOString()
    };
    
    setItems([...items, newItem]);
    setItemName('');
    setItemPrice('');
    resetTranscript();
  };

  // 处理表单提交
  const handleSubmit = (e) => {
    e.preventDefault();
    addItem(itemName, parseFloat(itemPrice));
  };

  // 开始语音识别
  const startListening = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: false, language: 'zh-CN' });
  };

  // 停止语音识别
  const stopListening = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
  };

  // 计算汇总数据
  const getSummaryData = () => {
    const categoryTotals = items.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = 0;
      }
      acc[item.category] += item.price;
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([category, value]) => ({
      category,
      value
    }));
  };

  // 计算总金额
  const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

  // 准备图表数据
  const pieData = getSummaryData();
  const barData = getSummaryData();

  // 饼图配置
  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'category',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {value}元',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
    color: ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6600'],
  };

  // 柱状图配置
  const barConfig = {
    data: barData,
    xField: 'category',
    yField: 'value',
    label: {
      position: 'top',
      content: '{value}元',
    },
    color: '#00ffff',
  };

  return (
    <div className="container">
      <h1>EasyNote - 餐饮即时记账</h1>
      
      {/* 输入区域 */}
      <div className="card">
        <h2>添加消费项目</h2>
        
        {/* 文字输入表单 */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              className="input"
              placeholder="项目名称"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
            <input
              type="number"
              className="input"
              placeholder="价格"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              step="0.01"
              min="0"
              required
            />
            <button type="submit" className="btn">
              添加
            </button>
          </div>
        </form>
        
        {/* 语音输入按钮 */}
        <div style={{ textAlign: 'center' }}>
          {browserSupportsSpeechRecognition ? (
            <button
              className={`btn ${isListening ? 'pulse' : ''}`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? '停止语音输入' : '开始语音输入'}
            </button>
          ) : (
            <p style={{ color: 'var(--text-secondary)' }}>浏览器不支持语音识别</p>
          )}
          {isListening && (
            <p style={{ marginTop: '10px', color: 'var(--secondary-color)' }}>
              正在聆听... 请说出项目名称和价格，例如："米饭 10元"
            </p>
          )}
        </div>
      </div>
      
      {/* 消费列表 */}
      <div className="card">
        <h2>消费明细</h2>
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>暂无消费记录</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>项目</th>
                <th>价格</th>
                <th>分类</th>
                <th>子分类</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.price.toFixed(2)}元</td>
                  <td>{item.category}</td>
                  <td>{item.subcategory}</td>
                  <td>{new Date(item.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* 数据汇总 */}
      {items.length > 0 && (
        <div className="card">
          <h2>数据汇总</h2>
          <div style={{ marginBottom: '20px' }}>
            <h3>总金额: {totalAmount.toFixed(2)}元</h3>
          </div>
          
          {/* 图表区域 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            <div>
              <h3>分类占比</h3>
              <Pie {...pieConfig} style={{ height: 300 }} />
            </div>
            <div>
              <h3>分类金额</h3>
              <Bar {...barConfig} style={{ height: 300 }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;