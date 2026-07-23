# Backup Mensal do Asilovida

Worker Cloudflare que executa backup automático do banco Supabase e salva no R2.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Lista endpoints disponíveis |
| `POST` | `/backup` | Executar backup manual |
| `GET` | `/restore` | Baixar arquivo SQL do backup |
| `GET` | `/restore/preview` | Visualizar SQL do backup |
| `POST` | `/restore/exec` | Instruções para restaurar |

## Como Usar

### Executar Backup
```bash
curl -X POST https://faam-backup.jhonjunn.workers.dev/backup
```

### Baixar Backup (para restore)
```bash
curl https://faam-backup.jhonjunn.workers.dev/restore -o backup.sql
```

### Restaurar Backup
1. Baixe o backup: `curl https://faam-backup.jhonjunn.workers.dev/restore -o backup.sql`
2. Acesse https://supabase.com/dashboard
3. Selecione o projeto asilovida
4. Vá em **SQL Editor** > **New Query**
5. Cole o conteúdo do `backup.sql`
6. Clique em **Run**

**ATENÇÃO:** O restore apaga os dados atuais e insere os do backup!

## Cron Automático

- **Quando:** Dia 1 de cada mês às 3h UTC
- **Arquivo:** `backups/backup-mensal.sql` (sobrescrito a cada execução)

## Status

- Worker: `faam-backup`
- URL: https://faam-backup.jhonjunn.workers.dev
- R2: `faam-documentos/backups/backup-mensal.sql`
