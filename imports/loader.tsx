import { useSubscription } from "@apollo/client";
import { useDeep } from "@deep-foundation/deeplinks/imports/client";
import { generateQuery, generateQueryData } from "@deep-foundation/deeplinks/imports/gql";
import { Link, LinkRelations } from "@deep-foundation/deeplinks/imports/minilinks";
import { useLocalStore } from "@deep-foundation/store/local";
import { useEffect, useMemo, useState } from "react";
import { useBaseTypes } from "./gui";

export function DeepLoaderFocus({
  focus,
  onChange,
}: {
  focus: any;
  onChange: (results: Link<number>[]) => any;
}) {
  const deep = useDeep();

  const query = useMemo(() => {
    const v = (focus?.value?.value);
    const variables = deep.serializeQuery(v);
    console.log(v, variables);
    return generateQuery({
      operation: 'subscription',
      queries: [generateQueryData({
        tableName: 'links',
        returning: 'id type_id from_id to_id value string { id value } number { id value } object { id value }',
        variables: v
        ? { ...variables, where: { _or: [variables.where, { typed: variables.where }] } }
        : { where: {}, limit: 0 },
      })],
      name: 'DEEPCASE',
    });
  }, [focus, focus?.value?.value]);
  const s = useSubscription(query.query, { variables: query.variables });
  useEffect(() => {
    if (s?.data?.q0) onChange(s?.data?.q0);
  }, [s]);

  console.log(s);

  return <></>;
}

export function DeepLoader({
  onChange
}: {
  onChange: (results: { [key: string]: any[] }) => any;
}) {
  const deep = useDeep();

  const [baseTypes, setBaseTypes] = useBaseTypes();
  const focusesCriteria = useMemo(() => {
    return generateQuery({
      operation: 'subscription',
      queries: [
        generateQueryData({
          tableName: 'links',
          returning: 'id type_id from_id to_id value string { id value } number { id value }  object { id value }',
          variables: {
            where: {
              _or: [
                { in: { type_id: { _eq: baseTypes.Focus } } },
                { typed: { in: { type_id: { _eq: baseTypes.Focus } } } },
                { type_id: { _eq: baseTypes.Query } },
                { id: { _in: [baseTypes.Query, baseTypes.Focus] } },
              ],
            },
            limit: baseTypes?.Focus ? 999999 : 0,
          } }),
      ],
      name: 'FOCUSES',
    });
  }, [baseTypes]);
  const focusesQ = useSubscription(focusesCriteria.query, { variables: focusesCriteria.variables });
  const focuses = (focusesQ?.data?.q0 || []);
  const onlyFocusLinks = useMemo(() => focuses?.filter(f => f.type_id === baseTypes?.Query), [focuses]);

  const [results, setResults] = useState<any>({});

  useEffect(() => {
    setResults((results) => {
      if (focuses.length) {
        const newResults = {
          ...results,
          focuses,
        };
        onChange(newResults);
        return newResults;
      }
      return results;
    });
  }, [focuses]);

  return <>
    {onlyFocusLinks?.map((f, i) => (<DeepLoaderFocus
      key={f.id}
      focus={f}
      onChange={(r) => {
        setResults((results) => {
          const newResults = {
            ...results,
            [f.id]: r,
          };
          onChange(newResults);
          return newResults;
        });
      }}
    />))}
  </>;
}