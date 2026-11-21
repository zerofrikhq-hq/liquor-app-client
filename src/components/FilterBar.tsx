import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../config/theme';

interface Props {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  inStockOnly: boolean;
  onToggleInStock: () => void;
  sortBy: string;
  onCycleSort: () => void;
}

export const FilterBar: React.FC<Props> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  inStockOnly,
  onToggleInStock,
  sortBy,
  onCycleSort,
}) => {
  const getSortLabel = () => {
    switch (sortBy) {
      case 'price_asc':
        return 'Price: Low → High';
      case 'price_desc':
        return 'Price: High → Low';
      default:
        return 'Featured';
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Category Pills Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        <TouchableOpacity
          style={[styles.categoryPill, selectedCategory === 'all' ? styles.categoryPillActive : null]}
          onPress={() => onSelectCategory('all')}
          activeOpacity={0.8}
        >
          <Text
            style={[styles.categoryText, selectedCategory === 'all' ? styles.categoryTextActive : null]}
          >
            All Products
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.toLowerCase();
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, isActive ? styles.categoryPillActive : null]}
              onPress={() => onSelectCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, isActive ? styles.categoryTextActive : null]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 2. Utility Filter Bar (In-Stock & Sort) */}
      <View style={styles.utilityBar}>
        {/* In Stock Toggle */}
        <TouchableOpacity
          style={[styles.toggleBtn, inStockOnly ? styles.toggleBtnActive : null]}
          onPress={onToggleInStock}
          activeOpacity={0.7}
        >
          <Ionicons
            name={inStockOnly ? 'checkbox' : 'square-outline'}
            size={16}
            color={inStockOnly ? colors.gold.dark : colors.text.muted}
          />
          <Text style={[styles.toggleBtnText, inStockOnly ? styles.toggleBtnTextActive : null]}>
            In Stock Only
          </Text>
        </TouchableOpacity>

        {/* Sort Selector */}
        <TouchableOpacity style={styles.sortBtn} onPress={onCycleSort} activeOpacity={0.7}>
          <Ionicons name="swap-vertical" size={14} color={colors.text.secondary} />
          <Text style={styles.sortBtnText}>{getSortLabel()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  categoryScroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingBottom: spacing.xs,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radii.full,
    backgroundColor: colors.surface.subtle,
    borderWidth: 1,
    borderColor: colors.surface.border,
  },
  categoryPillActive: {
    backgroundColor: colors.dark.bg,
    borderColor: colors.dark.bg,
  },
  categoryText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  categoryTextActive: {
    color: colors.gold.primary,
    fontWeight: '700',
  },
  utilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.surface.subtle,
  },
  toggleBtnActive: {
    backgroundColor: colors.gold.soft,
    borderWidth: 1,
    borderColor: colors.gold.primary,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  toggleBtnTextActive: {
    color: colors.gold.dark,
    fontWeight: '700',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    backgroundColor: colors.surface.subtle,
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
