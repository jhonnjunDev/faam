# FAAM - Sistema de Gestão Médica

Sistema web para gestão de cadastro de pacientes, com ficha completa, relatórios médicos, dashboard, busca/filtros, impressão e autenticação. Dados sincronizados em nuvem via Supabase.

**Desenvolvido por Jhonata**

## Funcionalidades

- **Autenticação** com código de acesso (sem senhas)
- **Dashboard** com estatísticas e gráficos
- **Cadastro completo** de pacientes
- **Relatórios médicos** em 6 tipos
- **Busca e filtros** avançados
- **Impressão/PDF** de fichas e relatórios
- **Gerenciamento de usuários** (admin cadastra funcionários)
- **Sincronização em nuvem** via Supabase

## Como Funciona o Login

| Quem | E-mail | Código |
|------|--------|--------|
| **Admin** | admin23@icloud | 2301 |
| **Funcionários** | (cadastrado pelo admin) | (definido pelo admin) |

### Fluxo:
1. Admin entra com **admin23@icloud** + código **2301**
2. Admin vai em **Gerenciar Usuários** e cadastra o funcionário
3. Admin define: nome, e-mail, código e perfil do funcionário
4. Funcionário faz login com o e-mail e código definido pelo admin

## Configuração do Supabase (Obrigatório para sincronizar dados)

### Passo 1: Criar conta no Supabase
1. Acesse [supabase.com](https://supabase.com) e crie uma conta gratuita
2. Clique em **"New Project"**
3. Dê um nome (ex: `faam`) e defina uma senha
4. Aguarde o projeto ser criado

### Passo 2: Obter credenciais
1. Vá em **Settings > API**
2. Copie o **Project URL** (algo como `https://xxxxx.supabase.co`)
3. Copie a **anon/public key** (chave que começa com `eyJ...`)

### Passo 3: Criar tabelas no banco
1. Vá em **SQL Editor** no painel do Supabase
2. Cole e execute o conteúdo do arquivo `supabase-setup.sql`

### Passo 4: Configurar o sistema
1. Abra o arquivo `js/supabase-config.js`
2. Substitua `COLE_AQUI_SEU_PROJECT_URL` pelo URL do projeto
3. Substitua `COLE_AQUI_SUA_CHAVE_ANON_KEY` pela chave pública

## Modo Offline

Se o Supabase não estiver configurado, o sistema funciona automaticamente em modo offline usando **localStorage** do navegador. Os dados ficam salvos apenas no computador atual.

## Deploy no GitHub Pages

1. Crie um repositório no GitHub
2. Faça push dos arquivos da pasta `asilovida/`
3. Vá em **Settings > Pages**
4. Em **Source**, selecione a branch `main` e a pasta `/ (root)`
5. Clique em **Save**
6. O site estará disponível em: `https://SEU-USUARIO.github.io/NOME-REPOSITORIO/`

## Estrutura

```
asilovida/
├── index.html              # Login
├── dashboard.html          # Painel principal
├── pacientes.html          # Listagem de pacientes
├── paciente-novo.html      # Cadastro
├── paciente-ficha.html     # Ficha completa
├── paciente-editar.html    # Edição
├── relatorios.html         # Lista de relatórios
├── relatorio-novo.html     # Novo relatório
├── relatorio-detalhe.html  # Detalhes/Impressão
├── usuarios.html           # Gerenciar usuários (admin)
├── supabase-setup.sql      # Script SQL para criar tabelas
├── css/style.css           # Estilos
└── js/
    ├── auth.js             # Autenticação
    ├── db.js               # Camada de dados (Supabase + localStorage)
    ├── dados-iniciais.js   # Dados de exemplo
    ├── supabase-config.js  # Configuração do Supabase
    └── utils.js            # Utilitários
```

## Permissões por Perfil

| Recurso | Admin | Médico | Assist. Social |
|---------|-------|--------|----------------|
| Dashboard | ✅ | ✅ | ✅ |
| Listar Pacientes | ✅ | ✅ | ✅ |
| Novo Paciente | ✅ | ✅ | ❌ |
| Editar Paciente | ✅ | ✅ | ❌ |
| Ver Ficha | ✅ | ✅ | ✅ |
| Listar Relatórios | ✅ | ✅ | ✅ |
| Novo Relatório | ✅ | ✅ | ❌ |
| Ver Relatório | ✅ | ✅ | ✅ |
| Gerenciar Usuários | ✅ | ❌ | ❌ |

## Observações

- O Supabase gratuito permite até 500MB de dados e 50.000 usuários ativos mensais
- Códigos de acesso são definidos pelo administrador
- Dados são sincronizados em tempo real entre dispositivos
- Sistema funciona tanto online quanto offline
