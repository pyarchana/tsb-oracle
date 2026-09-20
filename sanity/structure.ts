import type {StructureResolver} from 'sanity/structure'

/**
 * Groups documents by type, and splits contradictions by status.
 *
 * The split is there because "what is still unresolved" is the question worth
 * asking of this dataset, and a flat list of contradictions does not answer it.
 */
export const structure: StructureResolver = (S) =>
  S.list()
    .title('TSB Oracle')
    .items([
      S.documentTypeListItem('tsb').title('Source documents'),
      S.documentTypeListItem('claim').title('Claims'),
      S.divider(),
      S.listItem()
        .title('Contradictions')
        .child(
          S.list()
            .title('Contradictions')
            .items([
              S.listItem()
                .title('Unresolved')
                .child(
                  S.documentList()
                    .title('Unresolved')
                    .filter('_type == "contradiction" && status == "unresolved"'),
                ),
              S.listItem()
                .title('Resolved')
                .child(
                  S.documentList()
                    .title('Resolved')
                    .filter('_type == "contradiction" && status == "resolved"'),
                ),
              S.divider(),
              S.documentTypeListItem('contradiction').title('All contradictions'),
            ]),
        ),
      S.documentTypeListItem('decision').title('Decisions'),
    ])
