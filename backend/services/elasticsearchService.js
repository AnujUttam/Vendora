const { Client } = require("@elastic/elasticsearch");

const ES_INDEX = "vendora_products";
let esClient = null;
let isElasticsearchConnected = false;

const initElasticsearch = async () => {
  const node = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";
  try {
    esClient = new Client({
      node,
      auth: process.env.ELASTICSEARCH_API_KEY
        ? { apiKey: process.env.ELASTICSEARCH_API_KEY }
        : undefined,
      maxRetries: 2,
      requestTimeout: 3000
    });

    const health = await esClient.cluster.health();
    isElasticsearchConnected = true;
    console.log(`Elasticsearch connected: cluster status is ${health.status}`);

    // Create index if not exists
    const indexExists = await esClient.indices.exists({ index: ES_INDEX });
    if (!indexExists) {
      await esClient.indices.create({
        index: ES_INDEX,
        body: {
          mappings: {
            properties: {
              name: { type: "text", boost: 3 },
              description: { type: "text" },
              category: { type: "keyword" },
              brand: { type: "keyword" },
              price: { type: "float" },
              stock: { type: "integer" },
              averageRating: { type: "float" },
              isActive: { type: "boolean" },
              vendorId: { type: "keyword" },
              vendorStoreName: { type: "text" },
              createdAt: { type: "date" }
            }
          }
        }
      });
      console.log(`Elasticsearch index '${ES_INDEX}' created.`);
    }
  } catch (error) {
    isElasticsearchConnected = false;
    console.warn("Elasticsearch service not detected or unreachable:", error.message);
    console.warn("Will seamlessly fall back to MongoDB text/aggregate search.");
  }
};

// Initialize silently on startup
initElasticsearch().catch(() => {});

/**
 * Index or update product in Elasticsearch
 */
const indexProduct = async (product) => {
  if (!isElasticsearchConnected || !esClient) return;
  try {
    await esClient.index({
      index: ES_INDEX,
      id: product._id.toString(),
      document: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        images: product.images,
        averageRating: product.averageRating || 0,
        totalReviews: product.totalReviews || 0,
        isActive: product.isActive,
        vendorId: product.vendorId ? product.vendorId.toString() : null,
        createdAt: product.createdAt
      }
    });
  } catch (err) {
    console.warn("Failed to index product in Elasticsearch:", err.message);
  }
};

/**
 * Delete product from Elasticsearch
 */
const deleteProductFromES = async (productId) => {
  if (!isElasticsearchConnected || !esClient) return;
  try {
    await esClient.delete({
      index: ES_INDEX,
      id: productId.toString()
    });
  } catch (err) {
    console.warn("Failed to delete product from Elasticsearch:", err.message);
  }
};

/**
 * Search products in Elasticsearch
 */
const searchWithElasticsearch = async ({
  search,
  category,
  brand,
  minPrice,
  maxPrice,
  sort = "newest",
  page = 1,
  limit = 12
}) => {
  if (!isElasticsearchConnected || !esClient) {
    return null; // Signals controller to use MongoDB fallback
  }

  try {
    const must = [{ term: { isActive: true } }, { range: { stock: { gt: 0 } } }];
    const filter = [];

    if (search && search.trim()) {
      must.push({
        multi_match: {
          query: search.trim(),
          fields: ["name^3", "description", "brand^2", "category"],
          fuzziness: "AUTO"
        }
      });
    }

    if (category) {
      filter.push({ term: { category } });
    }

    if (brand) {
      filter.push({ term: { brand } });
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceRange = {};
      if (minPrice !== undefined) priceRange.gte = Number(minPrice);
      if (maxPrice !== undefined) priceRange.lte = Number(maxPrice);
      filter.push({ range: { price: priceRange } });
    }

    let sortOption = [{ createdAt: { order: "desc" } }];
    if (sort === "price_low") sortOption = [{ price: { order: "asc" } }];
    if (sort === "price_high") sortOption = [{ price: { order: "desc" } }];
    if (sort === "rating") sortOption = [{ averageRating: { order: "desc" } }];

    const from = (Math.max(1, page) - 1) * limit;

    const result = await esClient.search({
      index: ES_INDEX,
      from,
      size: limit,
      body: {
        query: {
          bool: {
            must,
            filter
          }
        },
        sort: sortOption
      }
    });

    const total = typeof result.hits.total === "number" ? result.hits.total : result.hits.total.value;
    const products = result.hits.hits.map((hit) => ({
      _id: hit._id,
      ...hit._source
    }));

    return {
      source: "elasticsearch",
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products
    };
  } catch (error) {
    console.warn("Elasticsearch query error:", error.message);
    return null; // Fallback to MongoDB
  }
};

module.exports = {
  initElasticsearch,
  indexProduct,
  deleteProductFromES,
  searchWithElasticsearch,
  getIsConnected: () => isElasticsearchConnected
};
