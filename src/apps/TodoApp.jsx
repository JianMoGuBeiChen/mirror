import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const TodoApp = ({ appId = 'todo', detectedUser }) => {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const { theme } = useTheme();
  
  const storageKey = `smartMirror_todos_${detectedUser || 'default'}`;

  // Load todos when user changes
  useEffect(() => {
    if (!detectedUser) {
      setTodos([]); // Clear todos if no user is detected
      return;
    }
    try {
      const savedTodos = JSON.parse(localStorage.getItem(storageKey) || '[]');
      setTodos(savedTodos);
    } catch (e) {
      console.error("Failed to load todos", e);
      setTodos([]);
    }
  }, [detectedUser, storageKey]);

  // Save todos when they change
  const saveTodos = (newTodos) => {
    setTodos(newTodos);
    if (detectedUser) {
      localStorage.setItem(storageKey, JSON.stringify(newTodos));
    }
  };

  const handleAddTodo = () => {
    if (inputValue.trim() === '') return;
    const newTodos = [...todos, { id: Date.now(), text: inputValue, completed: false }];
    saveTodos(newTodos);
    setInputValue('');
  };

  const toggleTodo = (id) => {
    const newTodos = todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
    saveTodos(newTodos);
  };
  
  const removeTodo = (id) => {
    const newTodos = todos.filter(todo => todo.id !== id);
    saveTodos(newTodos);
  };

  if (!detectedUser) {
    // This component will be hidden by SmartMirror.jsx, but as a fallback:
    return null; 
  }

  return (
    <div className="w-full h-full flex flex-col p-4">
      <div className="font-semibold text-lg mb-3" style={{ color: 'white' }}>
        <span role="img" aria-label="list" className="mr-1" style={{ color: theme.accent }}>📝</span>
        {detectedUser}'s Todo List
      </div>
      
      <div className="flex-1 overflow-auto space-y-2 pr-2">
        {todos.length === 0 && (
          <div className="text-white/60 text-sm text-center pt-4">No tasks yet.</div>
        )}
        {todos.map((todo) => (
          <div 
            key={todo.id} 
            className="flex items-center justify-between bg-white/5 p-2 rounded"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id)}
                className="form-checkbox h-4 w-4 rounded"
                style={{ accentColor: theme.accent }}
              />
              <span 
                className={`ml-3 text-sm ${todo.completed ? 'text-white/50 line-through' : 'text-white'}`}
              >
                {todo.text}
              </span>
            </div>
            <button 
              onClick={() => removeTodo(todo.id)}
              className="text-red-400/70 hover:text-red-400 text-lg"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          placeholder="New task..."
          className="flex-1 bg-white/10 px-3 py-2 rounded-l-md text-sm"
        />
        <button 
          onClick={handleAddTodo}
          className="px-4 py-2 rounded-r-md text-sm"
          style={{ background: theme.accent }}
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default TodoApp;