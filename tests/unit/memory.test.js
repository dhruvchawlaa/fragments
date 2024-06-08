const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory/index');

describe('Memory Database Tests', () => {
  const ownerId = 'user123';
  const fragment = {
    id: 'fragment1',
    ownerId,
    data: 'Some data',
  };

  test('Write and Read Fragment', async () => {
    await writeFragment(fragment);
    const retrievedFragment = await readFragment(ownerId, fragment.id);
    expect(retrievedFragment).toEqual(fragment);
  });

  test('Write and Read Fragment Data', async () => {
    const buffer = Buffer.from('Some data');
    await writeFragmentData(ownerId, fragment.id, buffer);
    const retrievedBuffer = await readFragmentData(ownerId, fragment.id);
    expect(retrievedBuffer).toEqual(buffer);
  });

  test('List Fragments', async () => {
    await writeFragment(fragment);
    const fragments = await listFragments(ownerId);
    expect(fragments).toContain(fragment.id);
  });

  test('Delete Fragment', async () => {
    await writeFragment(fragment);
    await deleteFragment(ownerId, fragment.id);
    const retrievedFragment = await readFragment(ownerId, fragment.id);
    expect(retrievedFragment).toBeUndefined();
    const retrievedData = await readFragmentData(ownerId, fragment.id);
    expect(retrievedData).toBeUndefined();
  });

  test('List Fragments with Expansion', async () => {
    await writeFragment(fragment);
    const fragments = await listFragments(ownerId, true);
    expect(fragments).toContainEqual(fragment);
  });

  test('List Fragments without Expansion', async () => {
    await writeFragment(fragment);
    const fragments = await listFragments(ownerId);
    expect(fragments).toContain(fragment.id);
  });
});
