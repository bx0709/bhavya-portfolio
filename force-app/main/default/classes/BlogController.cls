/**
 * BlogController
 * Exposes read-only, publicly-safe access to published Blog_Post__c records
 * for use by Experience Cloud guest users (and logged-in members).
 *
 * Security notes:
 * - Only Status__c = 'Published' AND Published_Date__c <= TODAY records are ever returned.
 * - Uses WITH SECURITY_ENFORCED so field/object-level permissions on the running
 *   user (including the Guest User profile) are respected.
 * - Field set is deliberately narrow — never SELECT * on a public-facing controller.
 */
public with sharing class BlogController {

    @AuraEnabled(cacheable=true)
    public static List<BlogPostSummary> getPublishedPosts() {
        List<Blog_Post__c> posts = [
            SELECT Id, Name, Slug__c, Summary__c, Featured_Image_URL__c, Published_Date__c, Tags__c
            FROM Blog_Post__c
            WHERE Status__c = 'Published'
            AND Published_Date__c <= TODAY
            WITH SECURITY_ENFORCED
            ORDER BY Published_Date__c DESC
            LIMIT 100
        ];

        List<BlogPostSummary> results = new List<BlogPostSummary>();
        for (Blog_Post__c p : posts) {
            results.add(new BlogPostSummary(p));
        }
        return results;
    }

    @AuraEnabled(cacheable=true)
    public static BlogPostDetail getPostBySlug(String slug) {
        if (String.isBlank(slug)) {
            return null;
        }
        List<Blog_Post__c> posts = [
            SELECT Id, Name, Slug__c, Summary__c, Content__c, Featured_Image_URL__c,
                   Published_Date__c, Tags__c
            FROM Blog_Post__c
            WHERE Status__c = 'Published'
            AND Published_Date__c <= TODAY
            AND Slug__c = :slug
            WITH SECURITY_ENFORCED
            LIMIT 1
        ];
        if (posts.isEmpty()) {
            return null;
        }
        return new BlogPostDetail(posts[0]);
    }

    public virtual class BlogPostSummary {
        @AuraEnabled public String id;
        @AuraEnabled public String title;
        @AuraEnabled public String slug;
        @AuraEnabled public String summary;
        @AuraEnabled public String imageUrl;
        @AuraEnabled public String publishedDate;
        @AuraEnabled public String tags;

        public BlogPostSummary(Blog_Post__c p) {
            this.id = p.Id;
            this.title = p.Name;
            this.slug = p.Slug__c;
            this.summary = p.Summary__c;
            this.imageUrl = p.Featured_Image_URL__c;
            this.publishedDate = p.Published_Date__c != null ? p.Published_Date__c.format() : '';
            this.tags = p.Tags__c;
        }
    }

    public class BlogPostDetail extends BlogPostSummary {
        @AuraEnabled public String content;

        public BlogPostDetail(Blog_Post__c p) {
            super(p);
            this.content = p.Content__c;
        }
    }
}