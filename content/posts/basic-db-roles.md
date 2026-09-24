---
title: Postgres Roles to Set Up on Day One
tags: [postgres, databases]
description: "A four-role PostgreSQL setup to use from day one"
date: 2026-09-14
draft: false
---

In an Alpha phase it's all about verifying that something works and sticks.
As things must go quick one might choose an ORM, create some entities, have one role that does migrations and serves the app. It's not best practice, but often happens for the sake of speed in the Alpha phase.

However it is really painful once your Alpha is a success, which is kinda funny.
Success means adoption, expectations, more tempo and more risk.
Now we have to work cleaner and introduce proper ownership and re-test which is a real pain in the butt with a lot of risk and no user payoff.

All this trouble can easily be avoided if we take a few minutes to set our roles up properly from the beginning. My basic setup looks like this:

| Role | Type | Purpose |
| --- | --- | --- |
| `postgres` | superuser/pseudo superuser | Use it to create new roles |
| `{application_name}_migration` | migration role | owns schema and tables, used for migrations |
| `{application_name}_app` | application user | used by application to CRUD on database, is not allowed to create/alter tables |
| `{application_name}_viewer` | debug, viewer role | only allowed to view data for debugging purposes |

The idea is simple: only migrations change the schema, and the app only touches data. If you have something to debug, then you have a role that does not allow you to mutate any data.

## Things to keep in mind

No matter how we create these roles (Terraform, Pulumi, etc.) a few details are easy to get wrong.

### Default privileges
It is easy to miss default privileges. For example, granting your `_app` or `_viewer` role access to all tables only covers tables that exist right now; any new table added after migration will lead to a permission denied. One might not even catch this in local development because, locally, you connect as the owner. 

So, we want to have our default privileges tied to the migration role.

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE myapp_migration GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO myapp_app;
ALTER DEFAULT PRIVILEGES FOR ROLE myapp_migration GRANT SELECT ON TABLES TO myapp_viewer;
```

Most IaC tools have a dedicated resource for this, for example, `postgresql_default_privileges` in a Terraform provider.

### Sequences
Also don't forget sequences, `_app` needs `USAGE` on sequences, otherwise inserts into serial columns fail.

### Two connection strings
It's also important to remember that the ORM or the migration tool needs to use the correct connection string with the migration user, and then at runtime, the connection string for the application user. 

This can easily be forgotten, and if the app auto-migrates on startup, `_app` ends up owning those tables (if the `_app` was ever given create rights). Even if you switch to the migration role later, those tables stay owned by the app. And since table owners skip row-level security by default (unless the table uses `FORCE ROW LEVEL SECURITY`), your app quietly ignores those guardrails.

### Cloud SQL does not give you a real superuser
Since I'm using Cloud SQL, the Postgres user is a pseudo-superuser with some limitations. E.g. the postgres user has to be a member of `_migration` before it can create objects or databases owned by that role.

### Lock down the public schema
I read that before Postgres 15, every role could create tables in public, which quietly undermines the "only migrations can change the schema" idea. Postgres 15+ fixed this by default. So in older versions, you have to kind of lock it down. 

My way of doing it is just starting with Postgres 15+. If you upgraded from an older version, the old permissions are still there.

## Conclusion

Spending about 10 to 20 minutes on day one in properly setting up your roles and configurations will save you many hours down the line and greatly reduce the risk of negative user impact.