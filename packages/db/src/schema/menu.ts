import { relations } from "drizzle-orm";
import { boolean, jsonb, pgTable, real, text, uuid, varchar, vector } from "drizzle-orm/pg-core";

import { restaurants } from "./restaurant";
import { timestamps } from "./shared";

// --- Tabela: menus ---

/** Ementas de cada restaurante (almoco, jantar, especial, etc.) */
export const menus = pgTable("menus", {
  id: uuid("id").primaryKey().defaultRandom(),
  restaurantId: uuid("restaurant_id")
    .notNull()
    .references(() => restaurants.id, { onDelete: "cascade" }),

  // Nome da ementa
  name: varchar("name", { length: 255 }).notNull(),

  isActive: boolean("is_active").notNull().default(true),

  ...timestamps,
});

// --- Tabela: dishes ---

/** Pratos pertencentes a uma ementa, com informacao de alergenos e embeddings */
export const dishes = pgTable("dishes", {
  id: uuid("id").primaryKey().defaultRandom(),
  menuId: uuid("menu_id")
    .notNull()
    .references(() => menus.id, { onDelete: "cascade" }),

  // Nome do prato
  name: varchar("name", { length: 255 }).notNull(),

  // Descricao multilingue: { "pt": "...", "en": "..." }
  description: jsonb("description"),

  // Preco em EUR
  price: real("price"),

  // Categoria
  category: varchar("category", { length: 50 }),

  // Alergenos (codificacao EU)
  allergens: text("allergens").array(),

  // Sinalizadores dieteticos (vegetarian, vegan, gluten_free, etc.)
  dietaryFlags: text("dietary_flags").array(),

  // Embedding para pesquisa semantica de pratos
  embedding: vector("embedding", { dimensions: 1024 }),

  isAvailable: boolean("is_available").notNull().default(true),

  ...timestamps,
});

// --- Relacoes ---

export const menusRelations = relations(menus, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [menus.restaurantId],
    references: [restaurants.id],
  }),
  dishes: many(dishes),
}));

export const dishesRelations = relations(dishes, ({ one }) => ({
  menu: one(menus, {
    fields: [dishes.menuId],
    references: [menus.id],
  }),
}));
