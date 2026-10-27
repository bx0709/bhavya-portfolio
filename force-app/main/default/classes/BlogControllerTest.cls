@IsTest
private class BlogControllerTest {

    @TestSetup
    static void setup() {
        insert new List<Blog_Post__c>{
            new Blog_Post__c(
                Name = 'Published Post',
                Slug__c = 'published-post',
                Summary__c = 'A published post',
                Content__c = '<p>Full content</p>',
                Status__c = 'Published',
                Published_Date__c = Date.today().addDays(-1),
                Tags__c = 'Apex,LWC'
            ),
            new Blog_Post__c(
                Name = 'Future Post',
                Slug__c = 'future-post',
                Summary__c = 'Not visible yet',
                Content__c = '<p>Future content</p>',
                Status__c = 'Published',
                Published_Date__c = Date.today().addDays(5)
            ),
            new Blog_Post__c(
                Name = 'Draft Post',
                Slug__c = 'draft-post',
                Summary__c = 'Not visible, still a draft',
                Content__c = '<p>Draft content</p>',
                Status__c = 'Draft',
                Published_Date__c = Date.today()
            )
        };
    }

    @IsTest
    static void testGetPublishedPostsOnlyReturnsPublished() {
        Test.startTest();
        List<BlogController.BlogPostSummary> results = BlogController.getPublishedPosts();
        Test.stopTest();

        System.assertEquals(1, results.size(), 'Only the published, past-dated post should be returned');
        System.assertEquals('published-post', results[0].slug);
    }

    @IsTest
    static void testGetPostBySlugReturnsContent() {
        Test.startTest();
        BlogController.BlogPostDetail detail = BlogController.getPostBySlug('published-post');
        Test.stopTest();

        System.assertNotEquals(null, detail);
        System.assertEquals('<p>Full content</p>', detail.content);
    }

    @IsTest
    static void testGetPostBySlugHidesDraftAndFuture() {
        Test.startTest();
        BlogController.BlogPostDetail draft = BlogController.getPostBySlug('draft-post');
        BlogController.BlogPostDetail future = BlogController.getPostBySlug('future-post');
        Test.stopTest();

        System.assertEquals(null, draft, 'Draft posts should never be returned');
        System.assertEquals(null, future, 'Future-dated posts should never be returned');
    }

    @IsTest
    static void testGetPostByBlankSlugReturnsNull() {
        System.assertEquals(null, BlogController.getPostBySlug(''));
        System.assertEquals(null, BlogController.getPostBySlug(null));
    }
}