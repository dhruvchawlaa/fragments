# 404 Test
GET http://localhost:8080/no-such-route

# We should get back an HTTP 1.1 404 response
HTTP/1.1 404

# Extra checks to perform against the response
[Asserts]
# Ensure the response status is "error"
jsonpath "$.status" == "error"
# Ensure the response contains an error object with code 404
jsonpath "$.error.code" == 404
# Ensure the response contains an error object with the message "not found"
jsonpath "$.error.message" == "not found"
