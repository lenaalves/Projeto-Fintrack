# FinTrack

![FinTrack Logo](https://img.shields.io/badge/FinTrack-Financial%20Tracker-blue?style=for-the-badge&logo=react)

Uma aplicação web para rastreamento financeiro pessoal, construída com React, TypeScript e Vite. Permite gerenciar transações, visualizar dashboards e manter controle sobre suas finanças.

## 🚀 Funcionalidades

- 📊 **Dashboard Interativo**: Visualize suas finanças com gráficos e relatórios
- 💰 **Gerenciamento de Transações**: Adicione, edite e categorize suas transações
- 🔐 **Autenticação Segura**: Login e registro com Supabase
- 📱 **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- ⚡ **Performance Otimizada**: Construído com Vite para carregamento rápido

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Linting**: ESLint
- **Deployment**: GitHub Pages / Vercel

## 📦 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/lenaalves/Projeto-Fintrack.git
   cd Projeto-Fintrack
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   Copie `.env.example` para `.env` e preencha com suas credenciais do Supabase.

4. Execute o projeto:
   ```bash
   npm run dev
   ```

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run preview` - Preview do build
- `npm run lint` - Executa o ESLint

## 📁 Estrutura do Projeto

```
Projeto-Fintrack/
├── public/          # Assets estáticos
├── src/
│   ├── assets/      # Imagens e ícones
│   ├── lib/         # Configurações (Supabase)
│   ├── pages/       # Páginas da aplicação
│   │   ├── Auth.tsx
│   │   └── Dashboard.tsx
│   ├── types/       # Definições TypeScript
│   ├── App.tsx      # Componente principal
│   └── main.tsx     # Ponto de entrada
├── .env             # Variáveis de ambiente
└── README.md
```

## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

---

Desenvolvido com ❤️ por Lorena Alves
