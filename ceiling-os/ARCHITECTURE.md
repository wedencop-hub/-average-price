# СТЕЛЯ OS 🇺🇦

## Правило ядра
Object — центральная сущность системы:

`Object → Drawing → Estimate → Materials → Production → Installation → Payroll → Payments → Expenses → Profit → Accounting`

Изменение геометрии или количества светильников должно пересчитывать зависимые материалы, себестоимость, клиентский кошторис и производственную спецификацию.

## Стек
- Next.js 16.3.3 / React 19.2.7 / TypeScript
- Telegram Mini Apps API
- Node.js backend
- PostgreSQL / Supabase
- S3-compatible storage
- REST или typed RPC

## Multi-tenant
Каждая бизнес-сущность имеет `company_id`. Доступ проверяется на сервере через membership + RBAC. Клиентские проверки интерфейса не считаются безопасностью.

## Phase 1
1. Telegram authentication и проверка initData на сервере.
2. users.
3. companies.
4. company_memberships.
5. roles/permissions.
6. subscriptions/plans.
7. audit_log.

## RBAC
`super_admin`, `company_owner`, `admin`, `manager`, `estimator`, `foreman`, `installer`, `accountant`, `warehouse_manager`, `production_manager`, `viewer`.

Монтажник по умолчанию не видит внутреннюю себестоимость, прибыль и финансовые метрики компании.

## Subscription plans
FREE → PRO → BUSINESS → ENTERPRISE.

Сервис подписок отделён от конкретного платёжного провайдера и должен поддерживать create, renew, cancel, expiration, grace period, plan change и access check.

## Security
- RLS на всех exposed tables.
- Не использовать `user_metadata` для авторизации.
- Не выдавать service_role клиенту.
- Все UPDATE policies имеют USING + WITH CHECK.
- Критические расчёты выполняются на сервере.
- Audit log для значимых действий.
- Storage policies изолируют файлы по tenant/company.

## UI
Приложение — украинское. Стиль: современный SaaS, белый/графитовый фон, синий и жёлтый акценты, сдержанные геометрические мотивы украинской вышивки.

Основной UX: `Замірив → намалював → отримав розрахунок → відправив клієнту.`
