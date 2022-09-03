import { test } from '@japa/runner'

function showHelloWorld(name: string) {
  return `Hello World ${name}!`
}

test('should show hello world', ({ assert }) => {
  assert.equal(showHelloWorld('Lucas'), 'Hello World Lucas!')
})
