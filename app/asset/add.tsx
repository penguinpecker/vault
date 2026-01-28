// VAULT - Add Asset Screen with Real API Search
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';
import debounce from 'lodash/debounce';
import { theme } from '../../constants/theme';
import { useHoldings } from '../../context/HoldingsContext';
import { searchAssets, getAssetPrice, getPopularAssets, SearchResult } from '../../services/assetSearch';

// Icons
const SearchIcon = ({ color = '#6b7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Circle cx="11" cy="11" r="8" />
    <Line x1="21" y1="21" x2="16.65" y2="16.65" />
  </Svg>
);

const XIcon = ({ color = '#6b7280', size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Line x1="18" y1="6" x2="6" y2="18" />
    <Line x1="6" y1="6" x2="18" y2="18" />
  </Svg>
);

const ChevronLeftIcon = ({ color = '#D4AF37', size = 24 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="15 18 9 12 15 6" />
  </Svg>
);

const TrendingUpIcon = ({ color = '#22c55e', size = 16 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <Polyline points="17 6 23 6 23 12" />
  </Svg>
);

// Asset type icons
const AssetIcon = ({ type, size = 24 }: { type: string; size?: number }) => {
  const color = {
    stock: theme.colors.gold.primary,
    etf: theme.colors.copper.primary,
    crypto: theme.colors.silver.primary,
    commodity: theme.colors.brass.primary,
  }[type] || theme.colors.grey[400];

  switch (type) {
    case 'crypto':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5 1.5 0 2.5 1 2.5 2.5s-1 2-2.5 2.5c-1.5.5-2.5 1.5-2.5 3" />
          <Circle cx="12" cy="17.5" r="0.5" fill={color} />
        </Svg>
      );
    case 'commodity':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="8" x2="12" y2="16" />
          <Line x1="8" y1="12" x2="16" y2="12" />
        </Svg>
      );
    case 'etf':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <Rect x="3" y="3" width="7" height="7" rx="1" />
          <Rect x="14" y="3" width="7" height="7" rx="1" />
          <Rect x="3" y="14" width="7" height="7" rx="1" />
          <Rect x="14" y="14" width="7" height="7" rx="1" />
        </Svg>
      );
    default: // stock
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <Polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <Polyline points="16 7 22 7 22 13" />
        </Svg>
      );
  }
};

export default function AddAssetScreen() {
  const router = useRouter();
  const { addHolding } = useHoldings();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [changePercent, setChangePercent] = useState<number>(0);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [adding, setAdding] = useState(false);

  // Show popular assets on mount
  useEffect(() => {
    setSearchResults(getPopularAssets());
  }, []);

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 1) {
        setSearchResults(getPopularAssets());
        setSearching(false);
        return;
      }

      setSearching(true);
      try {
        const results = await searchAssets(query);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  // Handle search input
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(getPopularAssets());
  };

  // Select asset and fetch price
  const handleSelectAsset = async (asset: SearchResult) => {
    setSelectedAsset(asset);
    setLoadingPrice(true);
    setCurrentPrice(null);

    try {
      const priceData = await getAssetPrice(asset.symbol, asset.type);
      if (priceData) {
        setCurrentPrice(priceData.price);
        setChangePercent(priceData.changePercent);
        setPurchasePrice(priceData.price.toString());
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    } finally {
      setLoadingPrice(false);
    }
  };

  // Go back to search
  const handleBackToSearch = () => {
    setSelectedAsset(null);
    setQuantity('');
    setPurchasePrice('');
    setCurrentPrice(null);
  };

  // Add the holding
  const handleAddHolding = async () => {
    if (!selectedAsset || !quantity || !purchasePrice) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(purchasePrice);

    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setAdding(true);

    try {
      await addHolding({
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        type: selectedAsset.type,
        quantity: qty,
        purchasePrice: price,
        currentPrice: currentPrice || price,
        dayChangePercent: changePercent,
      });

      router.back();
    } catch (error) {
      console.error('Error adding holding:', error);
      Alert.alert('Error', 'Failed to add asset. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  // Render search result item
  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleSelectAsset(item)}
    >
      <View style={styles.resultIcon}>
        <AssetIcon type={item.type} />
      </View>
      <View style={styles.resultInfo}>
        <Text style={styles.resultSymbol}>{item.symbol}</Text>
        <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
      </View>
      <View style={styles.resultMeta}>
        <Text style={styles.resultType}>{item.type.toUpperCase()}</Text>
        {item.exchange && (
          <Text style={styles.resultExchange}>{item.exchange}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Asset details view
  if (selectedAsset) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBackToSearch} style={styles.backButton}>
              <ChevronLeftIcon />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add Asset</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Asset Info */}
          <View style={styles.assetCard}>
            <View style={styles.assetHeader}>
              <View style={styles.assetIconLarge}>
                <AssetIcon type={selectedAsset.type} size={32} />
              </View>
              <View style={styles.assetInfo}>
                <Text style={styles.assetSymbol}>{selectedAsset.symbol}</Text>
                <Text style={styles.assetName} numberOfLines={1}>{selectedAsset.name}</Text>
              </View>
            </View>

            {loadingPrice ? (
              <ActivityIndicator color={theme.colors.gold.primary} style={{ marginTop: 16 }} />
            ) : currentPrice ? (
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>
                  ${currentPrice < 1 ? currentPrice.toPrecision(4) : currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
                <View style={[
                  styles.changeBadge,
                  { backgroundColor: changePercent >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
                ]}>
                  <TrendingUpIcon color={changePercent >= 0 ? '#22c55e' : '#ef4444'} />
                  <Text style={[
                    styles.changeText,
                    { color: changePercent >= 0 ? '#22c55e' : '#ef4444' }
                  ]}>
                    {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          {/* Input Fields */}
          <View style={styles.inputSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Quantity</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.colors.grey[600]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Purchase Price (USD)</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={theme.colors.grey[600]}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
              />
            </View>

            {quantity && purchasePrice && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Cost</Text>
                <Text style={styles.totalValue}>
                  ${(parseFloat(quantity || '0') * parseFloat(purchasePrice || '0')).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Text>
              </View>
            )}
          </View>

          {/* Add Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.addButton, adding && styles.addButtonDisabled]}
              onPress={handleAddHolding}
              disabled={adding || !quantity || !purchasePrice}
            >
              {adding ? (
                <ActivityIndicator color={theme.colors.black.pure} />
              ) : (
                <Text style={styles.addButtonText}>Add to Portfolio</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Search view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Asset</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stocks, crypto, commodities..."
            placeholderTextColor={theme.colors.grey[500]}
            value={searchQuery}
            onChangeText={handleSearchChange}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <XIcon />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.colors.gold.primary} size="large" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => `${item.symbol}-${item.type}`}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            searchQuery.length === 0 ? (
              <Text style={styles.sectionTitle}>Popular Assets</Text>
            ) : searchResults.length > 0 ? (
              <Text style={styles.sectionTitle}>Search Results</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No results found</Text>
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black.rich,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.white.pure,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.white.pure,
    height: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.grey[500],
  },
  resultsList: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.grey[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    marginBottom: 8,
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.black.rich,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white.pure,
    marginBottom: 2,
  },
  resultName: {
    fontSize: 13,
    color: theme.colors.grey[500],
  },
  resultMeta: {
    alignItems: 'flex-end',
  },
  resultType: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.gold.primary,
    marginBottom: 2,
  },
  resultExchange: {
    fontSize: 11,
    color: theme.colors.grey[600],
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.grey[400],
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.grey[600],
  },
  // Asset detail styles
  assetCard: {
    margin: 16,
    padding: 20,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 16,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIconLarge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: theme.colors.black.rich,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  assetInfo: {
    flex: 1,
  },
  assetSymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white.pure,
    marginBottom: 4,
  },
  assetName: {
    fontSize: 14,
    color: theme.colors.grey[500],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey[800],
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.white.pure,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.grey[400],
  },
  input: {
    height: 52,
    backgroundColor: theme.colors.black.card,
    borderWidth: 1,
    borderColor: theme.colors.grey[800],
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.white.pure,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: theme.colors.grey[500],
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.gold.primary,
  },
  footer: {
    padding: 16,
    marginTop: 'auto',
  },
  addButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: theme.colors.gold.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.black.pure,
  },
});
