'use strict';

angular.module('myApp', [])
    .controller('mainController', mainController)
    .directive('myGallery', myGallery)
    .directive('checkImage', checkImage);

function mainController() {}

/** @ngInject */
function myGallery($q, $filter) {
    return {
        restrict: 'E',
        scope: {
            feed: '=',
            search: '&',
            pagination: '&',
            "items-per-page": '&',
            "auto­rotate­time": '&',
            sorting: '&'
        },
        templateUrl: 'my-gallery.html',
        link: function(scope, element, attrs) {

            scope.itemsRange = [5,10,15,20];
            scope.images = [];
            scope.sort = 'title';
            scope.pages = [];
            scope.currentPage = 0;
            scope.changePage = changePage;
            scope.searchFilter = '';
            scope.searchGo = searchGo;
            scope.removeImage = removeImage;
            scope.range = range;
            scope.groupToPages = groupToPages;
            scope.resizeImage = resizeImage;

            scope.feed = attrs['feed'];
            scope.search = attrs['search'] || true;
            scope.itemsPerPage = parseInt(attrs['items­per­page']) || 10;
            scope.rotateSpeed = parseInt(attrs['auto­rotate­time']) || 4000;
            scope.pagination = attrs['pagination'] || true;
            scope.sorting = attrs['sorting'] || true;

            function searchMatch(haystack, needle) {
                if (!needle) {
                    return true;
                }
                return haystack.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
            }

            function searchGo(searchText) {
                scope.activeImages = $filter('filter')(scope.images, function (item) {
                    return !!(searchMatch(item['title'], searchText))
                });

                scope.activeImages = $filter('orderBy')(scope.activeImages, scope.sort);

                scope.currentPage = 0;

                groupToPages();
            }

            function groupToPages() {
                scope.pagedItems = [];

                for (var i = 0; i < scope.activeImages.length; i++) {
                    if (i % scope.itemsPerPage === 0) {
                        scope.pagedItems[Math.floor(i / scope.itemsPerPage)] = [scope.activeImages[i]];
                    } else {
                        scope.pagedItems[Math.floor(i / scope.itemsPerPage)].push(scope.activeImages[i]);
                    }
                }
            }

            function range(start, end) {
                var ret = [];
                if (!end) {
                    end = start;
                    start = 0;
                }
                for (var i = start; i < end; i++) {
                    ret.push(i);
                }
                return ret;
            }

            getFeed().then(function() {
                /** Add num of images per page from directive if not exist */
                if (scope.itemsRange.indexOf(scope.itemsPerPage) == -1) {
                    scope.itemsRange.push(scope.itemsPerPage);
                    scope.itemsRange.sort(compareNumeric);
                }

                scope.searchGo();

                /** Carousel autoplay */
                setInterval(function(){
                    $('#control-right').click();
                }, scope.rotateSpeed);

            });

            /** Get images from feed */
            function getFeed() {
                var deferred = $q.defer();
                if (localStorage.getItem('images')){
                    scope.images = JSON.parse(localStorage.getItem('images'));
                    scope.activeImages = angular.copy(scope.images);

                    deferred.resolve();
                }
                else {
                    if (scope.feed && angular.isArray(scope.feed)) {
                        scope.images = scope.feed;
                        scope.activeImages = angular.copy(scope.images);
                        deferred.resolve();
                    }
                    else if (scope.feed) {
                        $.getJSON(scope.feed, function (result) {
                            scope.images = result;
                            scope.activeImages = angular.copy(scope.images);
                            scope.$apply();
                            deferred.resolve();
                        });
                    }

                }
                return deferred.promise;
            }

            function removeImage(item) {
                var index = scope.activeImages.indexOf(item);
                scope.activeImages.splice(index, 1);
                groupToPages();
                localStorage.removeItem('images');
                localStorage.setItem('images', JSON.stringify(scope.activeImages));
            }

            function changePage(val) {
                if(angular.isString(val)) {
                    if(val == 'up')  scope.currentPage < scope.pages.length-1 ? scope.currentPage++ : scope.currentPage;
                    else scope.currentPage > 0 ? scope.currentPage-- : scope.currentPage;
                }
                else scope.currentPage = val;
            }

            function resizeImage(image) {

            }

        }
    }
}

function checkImage($compile) {
    return {
        link: function(scope, element) {
            element.bind('error', function() {
                element[0].outerHTML = '<div class="image-err">Image does not exist</div>';
                $compile(element.contents())(scope);
            });
        }
    }
}

/** Helper fn`s */
function compareNumeric(a, b) {
    if (a > b) return 1;
    if (a < b) return -1;
}
