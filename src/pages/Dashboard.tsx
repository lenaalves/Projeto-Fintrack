import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types/transaction'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

const CATEGORIES_INCOME = ['Salário', 'Freelance', 'Investimentos', 'Outros']
const CATEGORIES_EXPENSE = ['Alimentação', 'Transporte', 'Moradia', 'Saúde', 'Lazer', 'Outros']
const COLORS = ['#c4b5fd', '#f9a8d4', '#86efac', '#fcd34d', '#93c5fd', '#f0abfc']
const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const CATEGORY_EMOJI: Record<string, string> = {
  'Alimentação': '🍔', 'Transporte': '🚗', 'Moradia': '🏠',
  'Saúde': '💊', 'Lazer': '🎮', 'Salário': '💼',
  'Freelance': '💻', 'Investimentos': '📈', 'Outros': '📦'
}

interface Props { userEmail: string }

type Page = 'dashboard' | 'transactions' | 'add'

export default function Dashboard({ userEmail }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState<Page>('dashboard')

  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submitting, setSubmitting] = useState(false)

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false })
    if (data) setTransactions(data)
    setLoading(false)
  }

  useEffect(() => { fetchTransactions() }, [])

  async function handleAdd() {
    if (!amount || !category) return
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('transactions').insert({
      user_id: user!.id, type, amount: parseFloat(amount), category, description, date,
    })
    setAmount(''); setCategory(''); setDescription('')
    setDate(new Date().toISOString().split('T')[0])
    await fetchTransactions()
    setSubmitting(false)
    setPage('dashboard')
  }

  async function handleDelete(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    await fetchTransactions()
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  const pieData = CATEGORIES_EXPENSE.map(cat => ({
    name: cat,
    value: transactions.filter(t => t.type === 'expense' && t.category === cat).reduce((s, t) => s + t.amount, 0)
  })).filter(d => d.value > 0)

  const barData = MONTHS.map((month, i) => ({
    name: month,
    Receitas: transactions.filter(t => t.type === 'income' && new Date(t.date).getMonth() === i).reduce((s, t) => s + t.amount, 0),
    Despesas: transactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === i).reduce((s, t) => s + t.amount, 0),
  }))

  const categories = type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE
  const firstName = userEmail.split('@')[0]

  const navItems: { id: Page; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '🏡', label: 'Início' },
    { id: 'transactions', icon: '📋', label: 'Transações' },
    { id: 'add', icon: '➕', label: 'Adicionar' },
  ]

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif" }} className="flex min-h-screen w-full bg-rose-50">

      {/* Sidebar */}
      <aside className="w-56 min-w-[14rem] bg-white flex flex-col py-8 px-4 shadow-sm border-r border-rose-100 sticky top-0 h-screen">
        <div className="mb-10 px-2">
          <h1 className="text-xl font-extrabold text-violet-400">💸 FinTrack</h1>
          <p className="text-xs text-gray-400 mt-1">controle financeiro</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                page === item.id
                  ? 'bg-violet-100 text-violet-600'
                  : 'text-gray-400 hover:bg-rose-50 hover:text-rose-400'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-400 transition-all"
        >
          <span>🚪</span> Sair
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-x-hidden">

        {/* Header */}
<div className="flex justify-between items-center mb-6">
  <div>
    <h2 className="text-2xl font-extrabold text-gray-700">
      {page === 'dashboard' && `Olá, ${firstName} 👋`}
      {page === 'transactions' && 'Suas transações 📋'}
      {page === 'add' && 'Nova transação ✨'}
    </h2>
    <p className="text-sm text-gray-400 mt-1">
      {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
    </p>
  </div>
</div>

        {/* DASHBOARD PAGE */}
        {page === 'dashboard' && (
          <div className="flex flex-col gap-6">

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-violet-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-100 rounded-2xl flex items-center justify-center text-lg">💰</div>
                  <p className="text-sm font-bold text-gray-400">Saldo atual</p>
                </div>
                <p className={`text-3xl font-extrabold ${balance >= 0 ? 'text-violet-500' : 'text-red-400'}`}>
                  R$ {balance.toFixed(2)}
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-2xl flex items-center justify-center text-lg">📈</div>
                  <p className="text-sm font-bold text-gray-400">Receitas</p>
                </div>
                <p className="text-3xl font-extrabold text-green-400">R$ {totalIncome.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-pink-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-2xl flex items-center justify-center text-lg">📉</div>
                  <p className="text-sm font-bold text-gray-400">Despesas</p>
                </div>
                <p className="text-3xl font-extrabold text-pink-400">R$ {totalExpense.toFixed(2)}</p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pieData.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100">
                  <h3 className="font-extrabold text-gray-600 mb-4">Despesas por categoria</h3>
<ResponsiveContainer width="100%" height={280}>
  <PieChart>
    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                      <Tooltip formatter={(v: unknown) => `R$ ${Number(v).toFixed(2)}`} />
                        <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100">
                <h3 className="font-extrabold text-gray-600 mb-4">Evolução mensal</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#fef0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
                    <YAxis tick={{ fontSize: 11, fontFamily: 'Nunito' }} />
                    <Tooltip formatter={(v: unknown) => `R$ ${Number(v).toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="Receitas" fill="#86efac" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="Despesas" fill="#f9a8d4" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Últimas transações */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-extrabold text-gray-600">Últimas transações</h3>
                <button onClick={() => setPage('transactions')} className="text-xs text-violet-400 font-bold hover:underline">
                  Ver todas →
                </button>
              </div>
              {loading ? (
                <p className="text-sm text-gray-400">Carregando...</p>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma transação ainda.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.id} className="flex items-center justify-between py-3 border-b border-rose-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-base">
                          {CATEGORY_EMOJI[t.category] ?? '💳'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-600">{t.category}</p>
                          <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <p className={`font-extrabold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-pink-400'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TRANSACTIONS PAGE */}
        {page === 'transactions' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-rose-100">
            {loading ? (
              <p className="text-sm text-gray-400">Carregando...</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhuma transação ainda.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-3 border-b border-rose-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-rose-50 flex items-center justify-center text-base">
                        {CATEGORY_EMOJI[t.category] ?? '💳'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-600">{t.category}</p>
                        {t.description && <p className="text-xs text-gray-400">{t.description}</p>}
                        <p className="text-xs text-gray-400">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className={`font-extrabold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-pink-400'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                      </p>
                      <button onClick={() => handleDelete(t.id)} className="w-7 h-7 rounded-xl bg-red-50 text-red-300 hover:bg-red-100 hover:text-red-500 transition text-sm font-bold">
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADD PAGE */}
        {page === 'add' && (
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-rose-100 max-w-md">
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => { setType('expense'); setCategory('') }}
                className={`flex-1 py-3 rounded-2xl text-sm font-extrabold transition ${type === 'expense' ? 'bg-pink-200 text-pink-600' : 'bg-gray-100 text-gray-400'}`}
              >
                💸 Despesa
              </button>
              <button
                onClick={() => { setType('income'); setCategory('') }}
                className={`flex-1 py-3 rounded-2xl text-sm font-extrabold transition ${type === 'income' ? 'bg-green-200 text-green-600' : 'bg-gray-100 text-gray-400'}`}
              >
                💰 Receita
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <input
                type="number"
                placeholder="Valor (R$)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-2 border-rose-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-violet-300 transition"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border-2 border-rose-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-violet-300 transition text-gray-500"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(c => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>)}
              </select>
              <input
                type="text"
                placeholder="Descrição (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-2 border-rose-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-violet-300 transition"
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border-2 border-rose-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-violet-300 transition"
              />
              <button
                onClick={handleAdd}
                disabled={submitting}
                className="bg-violet-300 hover:bg-violet-400 text-white font-extrabold py-4 rounded-2xl transition disabled:opacity-50 mt-2"
              >
                {submitting ? 'Salvando...' : '✨ Adicionar transação'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}