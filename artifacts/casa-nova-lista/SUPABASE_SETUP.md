# Configuração do Supabase

O site usa o Supabase para autenticação, banco de dados e fotos. A aplicação usa somente a URL do projeto e a chave pública `anon`; não use uma chave `service_role` no navegador.

## Preparar o projeto

1. No Supabase, abra **SQL Editor** e execute o conteúdo de `supabase/setup.sql`. O script cria/atualiza as tabelas, políticas RLS, funções públicas seguras e bucket de imagens, além de autorizar `guilhenriquesilva10@gmail.com` como primeiro administrador. Ele converte registros antigos `fulfilled` para `purchased`, adiciona o link externo e preserva os demais dados.
2. Em **Authentication → Users**, crie um usuário com o e-mail `guilhenriquesilva10@gmail.com` e defina a senha lá. O Supabase Auth não deve ser criado por inserção manual em `auth.users` nem por senha gravada em SQL.
3. Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas nos Secrets do Replit.
4. Entre em `/admin` com o e-mail e a senha criados no passo 2. O endereço informado para entrega é configurado como público quando o campo ainda está vazio; anfitriões podem editá-lo ou ocultá-lo no painel.

## Acesso e privacidade

- A lista pública consulta somente presentes com status disponível.
- Presentes comprados continuam no painel e deixam de aparecer para os convidados. A confirmação pública usa uma função atômica que só altera presentes ainda disponíveis.
- O endereço é retornado ao público somente depois de ser preenchido e habilitado no painel.
- As políticas RLS permitem alterações apenas para e-mails incluídos em `admin_users`.
- Fotos ficam no bucket público `gift-photos`; somente administradores podem enviar, alterar ou excluir imagens.
- A chave Pix inicial é `guilhenriquesilva10@gmail.com`, conforme informado para o site, e pode ser alterada no painel.

Para conceder acesso a Alice ou a outro administrador, crie o usuário em **Authentication → Users** e insira o mesmo e-mail em `public.admin_users` pelo SQL Editor. Para revogar o acesso, remova a linha correspondente dessa tabela.
