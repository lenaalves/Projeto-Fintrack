import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  userEmail: string
  onClose: () => void
  onSave: (name: string, avatarUrl: string) => void
}

export default function Profile({ userEmail, onClose, onSave }: Props) {
  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (data) {
        setName(data.name ?? '')
        setAvatarUrl(data.avatar_url ?? '')
      }
    }
    loadProfile()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${user!.id}.${ext}`

    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      setAvatarUrl(data.publicUrl)
    }
    setUploading(false)
  }

  async function handleSave() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('profiles').upsert({
      user_id: user!.id,
      name,
      avatar_url: avatarUrl,
    }, { onConflict: 'user_id' })

    onSave(name, avatarUrl)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-xl border border-rose-100">
        <h2 className="text-xl font-extrabold text-gray-700 mb-6">Meu perfil ✨</h2>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-full bg-violet-100 flex items-center justify-center cursor-pointer overflow-hidden border-4 border-violet-200 hover:border-violet-400 transition mb-2"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl">🐱</span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-bold">
            {uploading ? 'Enviando...' : 'Clique pra trocar a foto'}
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>

        {/* Nome */}
        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-2 border-rose-100 rounded-2xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-violet-300 transition"
          />
          <p className="text-xs text-gray-400 text-center">{userEmail}</p>

          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="bg-violet-300 hover:bg-violet-400 text-white font-extrabold py-3 rounded-2xl transition disabled:opacity-50"
          >
            {saving ? 'Salvando...' : '💾 Salvar'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 font-bold text-sm hover:text-gray-600 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}