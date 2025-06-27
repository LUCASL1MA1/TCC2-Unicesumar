import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Animated, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icons from './constants/Icons';
import TelaLogin from './screens/TelaLogin';
import LayoutPrincipal from './screens/LayoutPrincipal';

// Tipos
type Task = {
  id: number;
  text: string;
  completed: boolean;
  createdAt: string;
};

type TransactionType = 'income' | 'expense';

type Transaction = {
  id: number;
  type: TransactionType;
  amount: number;
  description: string;
  category: keyof typeof categories;
  date: string;
};

type GoalType = 'tasks' | 'savings' | 'health' | 'learning' | 'personal';

type Goal = {
  id: number;
  title: string;
  current: number;
  target: number;
  type: GoalType;
  createdAt: string;
};

type UserData = {
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
};

type TabType = 'tasks' | 'goals' | 'finance' | 'profile';

// Constantes
const categories = {
  food: '🍕 Alimentação',
  transport: '🚗 Transporte',
  entertainment: '🎮 Lazer',
  health: '🏥 Saúde',
  education: '📚 Educação',
  other: '📦 Outros'
} as const;

const goalTypes: Record<GoalType, string> = {
  tasks: '📝 Tarefas',
  savings: '💰 Economia',
  health: '💪 Saúde',
  learning: '📚 Aprendizado',
  personal: '🎯 Pessoal'
};

const App = () => {
  // Estados principais
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showLogin, setShowLogin] = useState(true);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [activeTab, setActiveTab] = useState<TabType>('tasks');
  
  // Estados para tarefas
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingTask, setEditingTask] = useState<number | null>(null);
  
  // Estados para finanças
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [newTransaction, setNewTransaction] = useState<Omit<Transaction, 'id' | 'date'>>({ 
    type: 'expense', 
    amount: 0, 
    description: '', 
    category: 'food' 
  });
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null);
  
  // Estados para metas
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: 'Concluir 10 tarefas esta semana', current: 0, target: 10, type: 'tasks', createdAt: new Date().toLocaleDateString('pt-BR') },
    { id: 2, title: 'Economizar R$ 500 este mês', current: 0, target: 500, type: 'savings', createdAt: new Date().toLocaleDateString('pt-BR') },
    { id: 3, title: 'Ir à academia 12 vezes', current: 0, target: 12, type: 'health', createdAt: new Date().toLocaleDateString('pt-BR') }
  ]);
  
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  
  // Estado do usuário
  const [user, setUser] = useState<UserData>({ 
    name: 'Pedro Lucas', 
    level: 1, 
    xp: 0, 
    nextLevelXp: 100 
  });

  // Efeitos
  useEffect(() => {
    if (isLoggedIn) {
      setTimeout(() => setShowLogin(false), 600);
    }
  }, [isLoggedIn]);

  // Função de logoutr
const handleLogout = () => {
  setIsLoggedIn(false);
  setShowLogin(true);
};
  // Funções para tarefas
  const addTask = () => {
    if (!newTask?.trim()) return;
    
    const task: Task = {
      id: Date.now(),
      text: newTask.trim(),
      completed: false,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };
    setTasks(prev => [...prev, task]);
    setNewTask('');
    updateXP(10);
  };

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        if (completed) {
          updateXP(20);
          updateGoalProgress('tasks', 1);
        }
        return { ...task, completed };
      }
      return task;
    }));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const updateTask = (id: number, newText: string) => {
    if (!newText || !newText.trim()) return;
    
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, text: newText.trim() } : task
    ));
    setEditingTask(null);
  };

  // Funções para finanças
  const addTransaction = () => {
    const description = newTransaction.description?.trim() || "";
    if (!description || !newTransaction.amount) return;
    
    const transaction: Transaction = {
      id: Date.now(),
      ...newTransaction,
      description: description,
      date: new Date().toLocaleDateString('pt-BR')
    };
    
    setTransactions(prev => [...prev, transaction]);
    
    setNewTransaction({ 
      type: 'expense', 
      amount: 0, 
      description: '', 
      category: 'food' 
    });
    
    updateXP(15);
    
    if (transaction.type === 'income') {
      updateGoalProgress('savings', transaction.amount);
    }
  };

  const deleteTransaction = (id: number) => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => setTransactions(prev => prev.filter(t => t.id !== id)) }
      ]
    );
  };

  const updateTransaction = (id: number) => {
    const description = newTransaction.description?.trim() || "";
    if (!description || !newTransaction.amount) return;
    
    setTransactions(prev => prev.map(t => 
      t.id === id ? { 
        ...t, 
        type: newTransaction.type,
        amount: newTransaction.amount,
        description: description,
        category: newTransaction.category
      } : t
    ));
    
    setNewTransaction({ 
      type: 'expense', 
      amount: 0, 
      description: '', 
      category: 'food' 
    });
    
    setEditingTransaction(null);
  };

  // Funções para metas
 const addGoal = (goalData: { title: string; target: number; type: GoalType }) => {
    const title = goalData.title?.trim() || "";
    if (!title || !goalData.target) return;
    
    const goal: Goal = {
      id: Date.now(),
      title: title,
      target: Number(goalData.target),
      current: 0,
      type: goalData.type,
      createdAt: new Date().toLocaleDateString('pt-BR')
    };
    setGoals(prev => [...prev, goal]);
    setShowGoalForm(false);
    updateXP(25);
  };

  const updateGoal = (id: number, goalData: { title: string; target: number; type: GoalType }) => {
    const title = goalData.title?.trim() || "";
    if (!title || !goalData.target) return;
    
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { 
        ...goal, 
        title: title,
        target: Number(goalData.target),
        type: goalData.type
      } : goal
    ));
    setEditingGoalId(null);
    setShowGoalForm(false);
  };

  const deleteGoal = (id: number) => {
    Alert.alert(
      'Confirmação',
      'Tem certeza que deseja excluir esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', onPress: () => setGoals(prev => prev.filter(g => g.id !== id)) }
      ]
    );
  };

  const updateGoalProgress = (type: GoalType, amount: number = 1) => {
    setGoals(prev => prev.map(goal => {
      if (goal.type === type) {
        const newCurrent = Math.min(goal.current + amount, goal.target);
        if (newCurrent === goal.target && goal.current !== goal.target) {
          updateXP(50);
          Alert.alert('🎉 Parabéns!', `Você completou a meta: ${goal.title}!`);
        }
        return { ...goal, current: newCurrent };
      }
      return goal;
    }));
  };

  const incrementGoalProgress = (id: number) => {
    setGoals(prev => prev.map(goal => {
      if (goal.id === id) {
        const newCurrent = Math.min(goal.current + 1, goal.target);
        if (newCurrent === goal.target && goal.current !== goal.target) {
          updateXP(50);
          Alert.alert('🎉 Parabéns!', `Você completou a meta: ${goal.title}!`);
        }
        return { ...goal, current: newCurrent };
      }
      return goal;
    }));
  };

  const decrementGoalProgress = (id: number) => {
    setGoals(prev => prev.map(goal => 
      goal.id === id ? { ...goal, current: Math.max(goal.current - 1, 0) } : goal
    ));
  };

  // Sistema de XP
  const updateXP = (points: number) => {
    setUser(prev => {
      const newXp = prev.xp + points;
      const nextLevelXP = prev.level * 100;
      
      if (newXp >= nextLevelXP) {
        const newLevel = prev.level + 1;
        Alert.alert(`🚀 Level Up!`, `Parabéns! Você chegou ao nível ${newLevel}!`);
        return {
          ...prev,
          xp: newXp % nextLevelXP,
          level: newLevel,
          nextLevelXp: newLevel * 100
        };
      }
      
      return {
        ...prev,
        xp: newXp
      };
    });
  };

  // Cálculos financeiros
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;

  // Estilos
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc',
    },
  });

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {showLogin ? (
        <TelaLogin isDark={isDark} setIsDark={setIsDark} setIsLoggedIn={setIsLoggedIn} />
      ) : (
        <LayoutPrincipal
          isDark={isDark}
          setIsDark={setIsDark}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          tasks={tasks}
          newTask={newTask}
          setNewTask={setNewTask}
          editingTask={editingTask}
          setEditingTask={setEditingTask}
          addTask={addTask}
          toggleTask={toggleTask}
          deleteTask={deleteTask}
          updateTask={updateTask}
          transactions={transactions}
          newTransaction={newTransaction}
          setNewTransaction={setNewTransaction}
          editingTransaction={editingTransaction}
          setEditingTransaction={setEditingTransaction}
          addTransaction={addTransaction}
          deleteTransaction={deleteTransaction}
          updateTransaction={updateTransaction}
          goals={goals}
          showGoalForm={showGoalForm}
          setShowGoalForm={setShowGoalForm}
          editingGoalId={editingGoalId}
          setEditingGoalId={setEditingGoalId}
          addGoal={addGoal}
          updateGoal={updateGoal}
          deleteGoal={deleteGoal}
          incrementGoalProgress={incrementGoalProgress}
          decrementGoalProgress={decrementGoalProgress}
          user={user}
          handleLogout={handleLogout}
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
          balance={balance}
          categories={categories}
          goalTypes={goalTypes}
        />
      )}
    </Animated.View>
  );
};

export default App;