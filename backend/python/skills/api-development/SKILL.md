---
name: python-api-development
description: Boas práticas e padrão obrigatório para criar e evoluir APIs REST em Python (FastAPI, Pydantic v2, SQLAlchemy 2, PostgreSQL, pytest, Docker) no golden path. Use ao criar endpoints, CRUDs, services, validações, integração com Postgres, testes ou Dockerfile de backend Python, ou quando o usuário pedir "criar API", "novo endpoint", "backend em Python".
---

# Desenvolvimento de API Python (Golden Path)

Esqueleto pensado para vibecode: quem pede pode ser leigo, então **o agente decide pela stack padrão abaixo e não oferece alternativas**. Só fugir do padrão se o usuário pedir explicitamente.

Contrato HTTP (rotas, erros, paginação, health) é o mesmo da skill de API Node. Front não distingue qual backend respondeu.

## Stack padrão (não trocar)

| Camada | Escolha |
|--------|---------|
| Runtime | Python 3.12 (fixado em `.python-version` e `requires-python`) |
| HTTP | FastAPI |
| Validação | Pydantic v2 |
| Config | pydantic-settings |
| Banco | PostgreSQL via SQLAlchemy 2 (async) |
| HTTP externo | httpx (`AsyncClient`) |
| Logs | structlog em JSON |
| Testes | pytest + pytest-asyncio |
| Qualidade | Ruff (lint e format) + Pyright `strict` |
| Pacotes | uv (`pyproject.toml` + `uv.lock`) |
| Execução | Docker + docker-compose |

Proibido: Flask, Django, requests, SQL cru concatenado, print, pydantic v1.

## Estrutura de pastas

Organizar por **módulo de domínio** (feature), não por tipo de arquivo:

```
app/
├── main.py                      # cria o FastAPI, middlewares, routers (sem uvicorn)
├── config/
│   └── settings.py              # leitura e validação das variáveis de ambiente
├── shared/
│   ├── errors.py                # AppError, NotFoundError, ConflictError
│   ├── database/session.py      # engine e sessão (uma por request)
│   └── logger.py
└── modules/
    └── users/
        ├── router.py            # HTTP: valida borda, chama service, devolve response
        ├── schemas.py           # modelos Pydantic de entrada e saída
        ├── service.py           # regra de negócio
        ├── repository.py        # acesso ao banco (SQLAlchemy)
        └── test_service.py
```

Novo recurso = nova pasta em `modules/` com os mesmos 5 arquivos. Registrar o router em `app/main.py`.

`uvicorn` sobe só no Docker / comando de dev: `uvicorn app.main:app`. `main.py` não chama `uvicorn.run`.

## Responsabilidade de cada camada

- **router**: verbo, caminho, `response_model`, status code. Traduz HTTP. Não acessa banco, não tem regra.
- **service**: regras de negócio. Não importa FastAPI (`Request`, `Response`, `HTTPException`). Lança erros de domínio (`NotFoundError`, `ConflictError`).
- **repository**: única camada que importa SQLAlchemy. Não devolve instância ORM para fora; mapeia para o schema de saída antes de fechar o uso da sessão.
- **schemas**: contrato de entrada e saída. Service recebe o schema de entrada, nunca `dict` solto.

Dependência recebida no construtor:

```python
class UsersService:
    def __init__(self, repo: UsersRepository) -> None:
        self._repo = repo

    async def create(self, data: CreateUserRequest) -> UserResponse:
        if await self._repo.find_by_email(data.email):
            raise ConflictError("E-mail já cadastrado")
        return await self._repo.create(data)
```

Repository atrás de `Protocol` com os mesmos métodos. Router monta service com o repository real. Teste passa um fake.

## Configuração e variáveis de ambiente

- Toda env passa por `app/config/settings.py`. App **não sobe** se faltar variável.
- Proibido `os.environ` / `os.getenv` fora de `settings.py`.
- `.env` no `.gitignore`; manter `.env.example` atualizado com todas as chaves (sem valores reais).
- Um único `get_settings()` com `lru_cache`. Teste limpa o cache se trocar env.

```python
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: Literal["development", "test", "production"] = "development"
    port: int = 8000
    database_url: PostgresDsn
    log_level: Literal["debug", "info", "warning", "error"] = "info"
```

## Validação de entrada

- Todo endpoint declara body, path e query com Pydantic. FastAPI rejeita antes do service.
- `extra="forbid"` no body para rejeitar campo desconhecido.
- Nunca repassar o body como `dict` para o banco.
- Service recebe input já validado. Não revalidar o que o schema já garante.

```python
class CreateUserRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
```

Saída sempre com `response_model`. Campo interno (hash, flag de sistema) não entra no schema de resposta.

## Tratamento de erros

- Handlers registrados uma vez em `main.py`.
- Erros de domínio estendem `AppError` com `status_code` e `code`.
- Service não levanta `HTTPException`.
- Erro desconhecido: logar com stack, responder 500 genérico (nunca vazar stack, SQL ou DSN ao cliente).
- `RequestValidationError` do FastAPI vira o mesmo formato, status 400, code `VALIDATION_ERROR`.

Formato padrão de erro (sempre o mesmo):

```json
{ "error": { "code": "USER_NOT_FOUND", "message": "Usuário não encontrado", "details": [] } }
```

Mapeamento: Pydantic / request inválido -> 400 `VALIDATION_ERROR` · não encontrado -> 404 · duplicado (integridade no Postgres) -> 409.

## Padrão REST

- Recursos no plural, kebab-case: `/api/v1/users`, `/api/v1/order-items`.
- Versionar com prefixo `/api/v1`.
- Verbos: `GET` lista/detalhe, `POST` cria (201 + recurso), `PUT`/`PATCH` atualiza (200), `DELETE` remove (204).
- Listagens sempre paginadas: `?page=1&pageSize=20` (máx. 100), resposta `{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0 } }`.
- JSON em camelCase (`serialization_alias` / `validation_alias` com `populate_by_name=True`). Datas em ISO 8601 UTC.
- `GET /health` (liveness) e `GET /health/ready` (checa banco) obrigatórios, fora do prefixo `/api/v1`.

## Banco de dados (SQLAlchemy + Postgres)

Schema, tabelas e migrations ficam com a base de conhecimento do banco. Esta skill não cria migration, não roda Alembic e não altera DDL.

- Uma engine no processo. Sessão async **por request**, fechada no fim (dependência ou context manager). Proibido sessão global compartilhada.
- Operações que alteram várias tabelas: uma transação só. Commit no fim da request; rollback se `AppError` ou exceção.
- Selecionar só colunas necessárias. Sem lazy load fora da sessão.
- Evitar N+1: `selectinload` / join na mesma query, nunca query dentro de loop.
- SQL cru só com `text()` e parâmetros nomeados (`:email`). Proibido f-string, `%` ou `.format` com input do usuário.

## Fora de escopo agora

Auth, JWT, senha, CORS, rate limit e auditoria de dependências ficam para uma skill futura. Não adicionar isso por conta própria.

## Logs e observabilidade

- Usar `logger` (structlog), nunca `print`.
- Cada request gera ou repassa `x-request-id`. Esse id entra em todo log da request.
- Níveis: `error` falha inesperada · `warning` situação anômala tratada · `info` eventos de negócio · `debug` só local.
- Nunca logar segredo, token, DSN completo nem body de senha.

## Código Python

- Todo função e método público com type hints. Pyright `typeCheckingMode = "strict"`. Sem `Any`.
- `async`/`await` em rota, service e repository. Sem `.result()`, sem `time.sleep`, sem `requests`, sem `open()` bloqueante em código async.
- Cliente HTTP externo: `httpx.AsyncClient` criado no lifespan e fechado no shutdown. Sem cliente novo por request.
- `datetime` sempre com timezone UTC (`datetime.now(timezone.utc)`). Sem `datetime.utcnow()` (naive).
- Sem default mutável (`list`, `dict`, `set` como default).
- Imports absolutos (`from app.modules.users.service import UsersService`). Sem import estrela.
- Arquivos e funções em snake_case. Classes em PascalCase. Nomes de domínio em inglês (`find_user_by_email`).
- Funções pequenas, um propósito. Sem número ou string mágica: constante nomeada.
- Sem código comentado. Sem `except Exception: pass`.
- Comparar segredo, se um dia existir, com `secrets.compare_digest`.

Lifespan fecha engine (e o client httpx) no shutdown:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await engine.dispose()
```

## Testes

- pytest. Arquivo `test_<modulo>.py` ao lado do service: `modules/users/test_service.py`.
- Teste unitário de service: repository fake (classe que implementa o `Protocol`). Sem banco, sem TestClient, sem Docker.
- Nome: `test_deve_<resultado>_quando_<cenario>`.
- Estrutura Arrange-Act-Assert. Um comportamento por teste.
- Cobrir: caminho feliz, cada erro de domínio, borda que muda a regra.
- Não testar o que o Pydantic já rejeita na borda HTTP.
- Tarefa só termina com `uv run pytest` verde.

`pyproject.toml`:

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["app"]
```

```python
async def test_deve_lancar_conflict_error_quando_email_ja_existe() -> None:
    repo = FakeUsersRepository(existing=UserResponse(id=uuid4(), name="Ana", email="a@a.com"))
    service = UsersService(repo)

    with pytest.raises(ConflictError):
        await service.create(CreateUserRequest(name="Ana", email="a@a.com"))

    assert repo.created is False
```

- Arrange dentro do teste. Sem fixture que acumula estado entre testes.
- Fake explícito no lugar de `MagicMock` quando a interface é pequena.
- Não assertar ordem de chamada nem detalhe que a regra não exige.
- Proibido no teste unitário: Postgres, engine real, `TestClient`, arquivo, `.env` real, `sleep`, snapshot, `print`.

Teste de rota (TestClient + banco) não entra nesta skill.

## Comandos

```bash
uv run uvicorn app.main:app --reload --port 8000   # dev
uv run ruff check . && uv run ruff format --check .
uv run pyright
uv run pytest                                        # uma vez, sem watch
```

Ruff: `target-version = "py312"`, `line-length = 100`, regras `E`, `F`, `I`, `UP`, `B`.

## Docker

- Multi-stage: `build` (uv sync) -> `runtime` (venv + código, sem toolchain de build).
- Imagem base `python:3.12-slim`. `PYTHONUNBUFFERED=1`. Sem `--reload` na imagem.
- Rodar como usuário não-root.
- `HEALTHCHECK` batendo em `/health`.
- `.dockerignore` com `.venv`, `.env`, `__pycache__`, `.git`, `tests` locais soltos.
- Lifespan fecha engine no `SIGTERM`.

```dockerfile
FROM python:3.12-slim AS build
COPY --from=ghcr.io/astral-sh/uv:python3.12-bookworm-slim /usr/local/bin/uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY app ./app
RUN uv sync --frozen --no-dev

FROM python:3.12-slim AS runtime
WORKDIR /app
RUN useradd --create-home --uid 10001 appuser
COPY --from=build /app/.venv /app/.venv
COPY --from=build /app/app /app/app
ENV PATH="/app/.venv/bin:$PATH" PYTHONUNBUFFERED=1
USER appuser
EXPOSE 8000
HEALTHCHECK CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health')" || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Fluxo para criar um novo endpoint/recurso

```
- [ ] 1. Schemas Pydantic em schemas.py (extra=forbid, response_model)
- [ ] 2. Repository em cima do schema de banco já existente
- [ ] 3. test_service.py falhando (RED)
- [ ] 4. Service com a regra de negócio (GREEN)
- [ ] 5. router.py com status code e response_model; registrar no main.py
- [ ] 6. uv run ruff check, uv run pyright e uv run pytest verdes
- [ ] 7. Atualizar .env.example se surgiu variável nova
```

## Checklist antes de entregar

- [ ] Toda entrada com Pydantic (`extra=forbid`) e saída com `response_model`
- [ ] Erros no formato padrão, sem stack para o cliente
- [ ] Service sem FastAPI e sem SQLAlchemy
- [ ] Nenhum `Any`, `print` ou `os.environ` fora de `settings.py`
- [ ] Listagens paginadas, JSON camelCase, data UTC
- [ ] Sessão por request, SQL parametrizado
- [ ] Testes de service cobrindo feliz + erros de domínio, `uv run pytest` verde
- [ ] `docker compose up` sobe API e banco sem passos manuais
