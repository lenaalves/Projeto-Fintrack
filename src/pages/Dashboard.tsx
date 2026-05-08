import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/transaction'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const CATEGORIES_INCOME = ['Salário', 'Freelance', 'Investimentos', 'Outros']
const CATEGORIES_EXPENSE = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros']
const COLORS = ['#8b5cf6', '#ec4899', '#f97316', '#14b8a6', '#3b82f6', '#a3e635']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

interface Props {
  userEmail: string
}

export default function Dashboard({ userEmail }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  async function fetchTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [])

  async function handleAdd() {
    if (!amount || !category) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transactions').insert({
      user_id: user!.id,
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    })
    setAmount('')
    setCategory('')
    setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    await fetchTransactions()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    await fetchTransactions()
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  // Dados para gráfico de pizza (despesas por categoria)
  const pieData = CATEGORIES_EXPENSE.map(cat => ({
    name: cat,
    value: transactions
      .filter(t => t.type === 'expense' && t.category === cat)
      .reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0)

  // Dados para gráfico de barras (por mês)
  const barData = MONTHS.map((month, i) => ({
    name: month,
    Receitas: transactions
      .filter(t => t.type === 'income' && new Date(t.date).getMonth() === i)
      .reduce((s, t) => s + t.amount, 0),
    Despesas: transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === i)
      .reduce((s, t) => s + t.amount, 0),
  }))

  const categories = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">FinTrack 💸</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{userEmail}</span>
            <button onClick={() => supabase.auth.signOut()} className="text-sm text-violet-500 hover:underline">
              Sair
            </button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Saldo</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Receitas</p>
            <p className="text-xl font-bold text-green-500">R$ {totalIncome.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Despesas</p>
            <p className="text-xl font-bold text-red-500">R$ {totalExpense.toFixed(2)}</p>
          </div>
        </div>

        {/* Gráfico de pizza */}
        {pieData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-700 mb-4">Despesas por categoria</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                  <Tooltip formatter={(value) => `R$ ${Number(value ?? 0).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfico de barras */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Evolução mensal</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: unknown) => `R$ ${Number(v).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="font-semibold text-gray-700 mb-4">Nova transação</h2>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => { setType('expense'); setCategory('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Despesa
            </button>
            <button
              onClick={() => { setType('income'); setCategory('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'}`}
            >
              Receita
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <input
              type="number"
              placeholder="Valor (R$)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-600"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="text"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="bg-violet-500 hover:bg-violet-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </div>

        {/* Lista de transações */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-4">Transações</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Carregando...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma transação ainda.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {transactions.map(t => (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{t.category}</p>
                    {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                    <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={`font-bold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                    </p>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-400 transition text-lg">
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}