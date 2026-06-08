declare const value: unknown;
declare function useGetPeople(): { data: string[] };

type QueryResult = ReturnType<typeof useGetPeople>;
const unsafeValue = value as unknown as string;
const queryResult = {} as QueryResult;

test('snapshot fixture', () => {
	expect(`${unsafeValue}:${queryResult.data.length}`).toMatchSnapshot();
});
