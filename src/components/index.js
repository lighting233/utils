import PageSearch from './page-search/page-search.vue';
import PageContent from './page-content/page-content.vue';
import PageModal from './page-modal/page-modal.vue';
import usePageContent from './hooks/usePageContent';
import usePageModal from './hooks/usePageModal';
import setupUseLoginStoreForPermissions from './hooks/usePermissions';
import PageContentColada from './page-content-colada/page-content-colada.vue';
import PageModalColada from './page-modal-colada/page-modal-colada.vue';

export {
    PageSearch,
    PageContent,
    PageModal,
    usePageContent,
    usePageModal,
    setupUseLoginStoreForPermissions,
    PageContentColada,
    PageModalColada
}